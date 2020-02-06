import { Module } from '@nestjs/common';
import { TaskPriorityController } from './task-priority.controller';

@Module({
  controllers: [TaskPriorityController]
})
export class TaskPriorityModule {
}
