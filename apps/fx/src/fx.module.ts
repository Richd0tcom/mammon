import { Module } from '@nestjs/common';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';

@Module({
  imports: [],
  controllers: [FxController],
  providers: [FxService],
})
export class FxModule {}
