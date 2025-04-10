import { Test, TestingModule } from '@nestjs/testing';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';

describe('FxController', () => {
  let fxController: FxController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FxController],
      providers: [FxService],
    }).compile();

    fxController = app.get<FxController>(FxController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(fxController.getHello()).toBe('Hello World!');
    });
  });
});
