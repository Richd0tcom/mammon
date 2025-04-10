import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [IdentityController],
  providers: [],
})
export class IdentityModule {}
