import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UserController],
  imports: [
    AuthModule
  ]
})
export class UsersModule {
}
