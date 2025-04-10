import { NestFactory } from '@nestjs/core';
import { WalletDomainModule } from './wallet-domain.module';

async function bootstrap() {
  const app = await NestFactory.create(WalletDomainModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
