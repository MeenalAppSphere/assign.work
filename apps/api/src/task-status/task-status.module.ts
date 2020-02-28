import { Module } from '@nestjs/common';
import { TaskStatusController } from './task-status.controller';

@Module({
  controllers: [TaskStatusController]
})
export class TaskStatusModule {
}
