import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { UsersModule } from '../users/users.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [UsersModule, OrganizationModule]
})
export class ProjectModule {
}
