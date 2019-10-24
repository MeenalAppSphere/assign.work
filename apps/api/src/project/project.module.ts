import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';

@Module({
  controllers: [ProjectController],
  providers: [],
  imports: []
})
export class ProjectModule {
}
