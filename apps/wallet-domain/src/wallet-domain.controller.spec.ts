import { Test, TestingModule } from '@nestjs/testing';
import { WalletDomainController } from './wallet-domain.controller';
import { WalletDomainService } from './wallet-domain.service';

describe('WalletDomainController', () => {
  let walletDomainController: WalletDomainController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WalletDomainController],
      providers: [WalletDomainService],
    }).compile();

    walletDomainController = app.get<WalletDomainController>(WalletDomainController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(walletDomainController.getHello()).toBe('Hello World!');
    });
  });
});
