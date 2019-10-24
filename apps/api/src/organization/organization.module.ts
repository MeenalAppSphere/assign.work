import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [OrganizationController],
  providers: [],
  exports: [],
  imports: [UsersModule]
})
export class OrganizationModule {
}
