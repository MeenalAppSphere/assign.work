import { Module } from '@nestjs/common';
import { UserRoleController } from './user-role.controller';

@Module({
  controllers: [UserRoleController]
})
export class UserRoleModule {
}
