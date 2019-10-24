import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [],
  exports: [],
  controllers: [UserController],
  imports: [
    AuthModule
  ]
})
export class UsersModule {
}
