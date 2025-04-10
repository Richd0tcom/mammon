import { Controller, Get } from '@nestjs/common';
import { WalletDomainService } from './wallet-domain.service';

@Controller()
export class WalletDomainController {
  constructor(private readonly walletDomainService: WalletDomainService) {}

  @Get()
  getHello(): string {
    return this.walletDomainService.getHello();
  }
}
