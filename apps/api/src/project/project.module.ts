import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [UsersModule]
})
export class ProjectModule {}
