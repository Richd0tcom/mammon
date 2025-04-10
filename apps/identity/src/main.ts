import { NestFactory } from '@nestjs/core';
import { IdentityModule } from './identity.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(IdentityModule, {
    transport: Transport.TCP,
    options: {
      port: 3003
    }
  });
  await app.listen();
}
bootstrap();
