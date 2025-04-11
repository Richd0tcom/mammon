import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FxService } from "apps/fx/src/fx.service";
import { Repository, Transaction, DataSource } from "typeorm";
import { Wallet } from "./entities/wallet.entity";
import { TransactionEntry } from "../transactions/entities/tx-entry";
import { Transaction as WalletTransaction} from "../transactions/entities/transaction.entity";
import { ConvertCurrencyDto, FundWalletDto, TradeDto } from "./dto/create-wallet.dto";
import { v4 as uuidv4 } from 'uuid';

enum Txtype {

}

@Injectable()
export class WalletService {

  private readonly COMPANY_WALLET = ""
  constructor(
    @InjectRepository(Wallet)
    private readonly walletAccountRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(TransactionEntry)
    private readonly transactionEntryRepository: Repository<TransactionEntry>,
    private readonly fxService: FxService,
    private readonly dataSource: DataSource,
  ) {}

  async createDefaultWallets(userId: string): Promise<void> {
    // Create default wallets for the most common currencies
    const defaultCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
    
    for (const currency of defaultCurrencies) {
      const walletAccount = this.walletAccountRepository.create({
        userId,
        currency,
        balance: 0,
      });
      
      await this.walletAccountRepository.save(walletAccount);
    }
  }

  async getWalletBalances(userId: string): Promise<Wallet[]> {
    return this.walletAccountRepository.find({
      where: { userId },
      select: ['id', 'currency', 'balance', 'createdAt', 'updatedAt'],
    });
  }

  async getWalletAccountByCurrency(userId: string, currency: string): Promise<Wallet> {
    const walletAccount = await this.walletAccountRepository.findOne({
      where: { userId, currency },
    });
    
    if (!walletAccount) {
      // Create the wallet if it doesn't exist
      const newWalletAccount = this.walletAccountRepository.create({
        userId,
        currency,
        balance: 0,
      });
      
      return this.walletAccountRepository.save(newWalletAccount);
    }
    
    return walletAccount;
  }

  async fundWallet(userId: string, fundWalletDto: FundWalletDto): Promise<any> {
    const { currency, amount, reference } = fundWalletDto;
    
    // Check if transaction already exists (idempotency)
    if (reference) {
      const existingTransaction = await this.transactionRepository.findOne({
        where: { reference, userId, type: 'FUNDING' },
      });
      
      if (existingTransaction) {
        return {
          message: 'Transaction already processed',
          transactionId: existingTransaction.id,
        };
      }
    }
    
    // Begin transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Get or create wallet account
      let walletAccount = await this.getWalletAccountByCurrency(userId, currency);
      
      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId,
        type: 'FUNDING',
        reference: reference || uuidv4(),
        status: 'COMPLETED',
        metadata: JSON.stringify({ 
          fundingMethod: fundWalletDto.fundingMethod || 'direct',
          notes: fundWalletDto.notes || 'Wallet funding'
        }),
      });
      
      const savedTransaction = await queryRunner.manager.save(transaction);
      
      // Create transaction entry (credit to wallet)
      const transactionEntry = this.transactionEntryRepository.create({
        transactionId: savedTransaction.id,
        walletAccountId: walletAccount.id,
        currency,
        amount, // Positive for credit
      });
      
      await queryRunner.manager.save(transactionEntry);
      
      // Update wallet balance
      walletAccount.balance = Number(walletAccount.balance) + Number(amount);
      await queryRunner.manager.save(walletAccount);
      
      await queryRunner.commitTransaction();
      
      return {
        message: 'Wallet funded successfully',
        transactionId: savedTransaction.id,
        currentBalance: walletAccount.balance,
        currency,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //use service to service comms
  async convertCurrency(userId: string, convertDto: ConvertCurrencyDto): Promise<any> {
    const { fromCurrency, toCurrency, amount, reference } = convertDto;
    

    
    // Begin transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Get source wallet account
      const sourceWallet = await this.getWalletAccountByCurrency(userId, fromCurrency);
      
      // Check if source wallet has sufficient funds
      if (Number(sourceWallet.balance) < Number(amount)) {
        throw new BadRequestException(`Insufficient ${fromCurrency} balance`);
      }
      
      // Get or create destination wallet account
      const destWallet = await this.getWalletAccountByCurrency(userId, toCurrency);
      
      // Get exchange rate
      const rate = await this.fxService.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = Number(amount) * rate;
      
      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId,
        type: 'CONVERSION',
        reference: reference || uuidv4(),
        status: 'COMPLETED',
        metadata: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount,
          convertedAmount,
          rate,
        }),
      });
      
      const savedTransaction = await queryRunner.manager.save(transaction);
      
      // Create debit entry (from source wallet)
      const debitEntry = this.transactionEntryRepository.create({
        transactionId: savedTransaction.id,
        walletAccountId: sourceWallet.id,
        currency: fromCurrency,
        amount: -amount, // Negative for debit
      });
      
      await queryRunner.manager.save(debitEntry);
      
      // Create credit entry (to destination wallet)
      const creditEntry = this.transactionEntryRepository.create({
        transactionId: savedTransaction.id,
        walletAccountId: destWallet.id,
        currency: toCurrency,
        amount: convertedAmount, // Positive for credit
        exchangeRate: rate,
      });
      
      await queryRunner.manager.save(creditEntry);
      
      // Update wallet balances
      sourceWallet.balance = Number(sourceWallet.balance) - Number(amount);
      destWallet.balance = Number(destWallet.balance) + Number(convertedAmount);
      
      await queryRunner.manager.save(sourceWallet);
      await queryRunner.manager.save(destWallet);
      
      await queryRunner.commitTransaction();
      
      return {
        message: 'Currency converted successfully',
        transactionId: savedTransaction.id,
        fromCurrency,
        fromAmount: amount,
        toCurrency,
        toAmount: convertedAmount,
        rate,
        sourceBalance: sourceWallet.balance,
        destinationBalance: destWallet.balance,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processTx(userId: string, tradeDto: TradeDto, rate: number): Promise<any> {

    const { fromCurrency, toCurrency, amount, reference } = tradeDto;

        // Begin transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction("SERIALIZABLE");
        
        try {
          // Get source wallet account
          const sourceWallet = await this.getWalletAccountByCurrency(userId, fromCurrency);
          
          // Check if source wallet has sufficient funds
          if (Number(sourceWallet.balance) < Number(tradeDto.amount)) {
            throw new BadRequestException(`Insufficient ${fromCurrency} balance`);
          }
          
          // Get or create destination wallet account
          const destWallet = await this.getWalletAccountByCurrency(this.COMPANY_WALLET, toCurrency);
          
          // Get exchange rate (will be sent in data from fx microservice)

          
          // Calculate trading fee (if applicable)
          const tradingFeePercentage = 0.5; // 0.5% fee
          const tradingFee = (Number(amount) * tradingFeePercentage) / 100;
          
          // Calculate converted amount after fee
          const amountAfterFee = Number(amount) - tradingFee;
          const convertedAmount = amountAfterFee * rate;
          
          // Create transaction record
          const transaction = this.transactionRepository.create({
            userId,
            type: 'TRADE',
            reference: reference || uuidv4(),
            status: 'COMPLETED',
            metadata: JSON.stringify({
              fromCurrency,
              toCurrency,
              amount,
              tradingFee,
              amountAfterFee,
              convertedAmount,
              rate,
            }),
          });
          
          const savedTransaction = await queryRunner.manager.save(transaction);
          
          // Create debit entry (from source wallet)
          const debitEntry = this.transactionEntryRepository.create({
            transactionId: savedTransaction.id,
            walletAccountId: sourceWallet.id,
            currency: fromCurrency,
            amount: -amount, // Negative for debit
          });
          
          await queryRunner.manager.save(debitEntry);
          
          // Create fee entry (if using a fee wallet)
          if (tradingFee > 0) {
            // In a real system, fees might go to a company fee wallet
            // For simplicity, we're just recording the fee in this transaction

            // Create credit entry (to destination wallet)
          const feeCreditEntry = this.transactionEntryRepository.create({
            transactionId: savedTransaction.id,
            walletAccountId: destWallet.id,
            currency: toCurrency,
            amount: convertedAmount, // Positive for credit
            exchangeRate: rate,
          });
          await queryRunner.manager.save(feeCreditEntry);
          }
          
          // Create credit entry (to destination wallet)
          const creditEntry = this.transactionEntryRepository.create({
            transactionId: savedTransaction.id,
            walletAccountId: destWallet.id,
            currency: toCurrency,
            amount: convertedAmount, // Positive for credit
            exchangeRate: rate,
          });
          
          await queryRunner.manager.save(creditEntry);
          
          // Update wallet balances
          sourceWallet.balance = Number(sourceWallet.balance) - Number(amount);
          destWallet.balance = Number(destWallet.balance) + Number(convertedAmount);
          
          await queryRunner.manager.save(sourceWallet);
          await queryRunner.manager.save(destWallet);
          
          await queryRunner.commitTransaction();
        
          return {
            message: 'Trade completed successfully',
            transactionId: savedTransaction.id,
            fromCurrency,
            fromAmount: amount,
            tradingFee,
            toCurrency,
            toAmount: convertedAmount,
            rate,
            sourceBalance: sourceWallet.balance,
            destinationBalance: destWallet.balance,
          };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
  }
}