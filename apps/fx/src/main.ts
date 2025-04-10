import { NestFactory } from '@nestjs/core';
import { FxModule } from './fx.module';

async function bootstrap() {
  const app = await NestFactory.create(FxModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
