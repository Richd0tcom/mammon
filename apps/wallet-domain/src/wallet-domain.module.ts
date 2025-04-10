import { Module } from '@nestjs/common';
import { WalletDomainController } from './wallet-domain.controller';
import { WalletDomainService } from './wallet-domain.service';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [TransactionsModule, WalletsModule],
  controllers: [WalletDomainController],
  providers: [WalletDomainService],
})
export class WalletDomainModule {}
