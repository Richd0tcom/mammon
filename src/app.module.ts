import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletsModule } from './wallets/wallets.module';
import { FxModule } from './fx/fx.module';
import { FxSocketModule } from './fx-socket/fx-socket.module';

@Module({
  imports: [WalletsModule, FxModule, FxSocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
