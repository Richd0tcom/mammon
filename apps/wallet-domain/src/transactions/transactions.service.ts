import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionEntry } from './entities/tx-entry';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionEntry)
    private readonly transactionEntryRepository: Repository<TransactionEntry>,
  ) {}

  async getTransactionHistory(
    userId: string,
    options: { page: number; limit: number; type?: string },
  ) {
    const { page, limit, type } = options;
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    
    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }
    
    const [transactions, total] = await queryBuilder.getManyAndCount();
    
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const entries = await this.transactionEntryRepository.find({
          where: { transactionId: transaction.id },
        });
        
        // Parse metadata if available
        let metadata = {};
        if (transaction.metadata) {
          try {
            metadata = JSON.parse(transaction.metadata);
          } catch (e) {
            metadata = { raw: transaction.metadata };
          }
        }
        
        return {
          ...transaction,
          entries,
          metadata,
        };
      }),
    );
    
    return {
      data: enrichedTransactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionDetails(userId: string, transactionId: string) {
    const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.id = :transactionId', { transactionId })
      .andWhere('transaction.userId = :userId', { userId })
      .getOne();
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    
    const entries = await this.transactionEntryRepository.find({
      where: { transactionId: transaction.id },
    });
    
    // Parse metadata if available
    let metadata = {};
    if (transaction.metadata) {
      try {
        metadata = JSON.parse(transaction.metadata);
      } catch (e) {
        metadata = { raw: transaction.metadata };
      }
    }
    
    return {
      ...transaction,
      entries,
      metadata,
    };
  }
}