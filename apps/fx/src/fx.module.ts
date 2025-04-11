import { Module } from '@nestjs/common';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "WALLETS_CLIENT",
        transport: Transport.TCP,
        options: {
          port: 3003
        }
      }
    ])
  ],
  controllers: [FxController],
  providers: [FxService],
})
export class FxModule {}
