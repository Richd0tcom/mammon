import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletDomainService {
  getHello(): string {
    return 'Hello World!';
  }
}
