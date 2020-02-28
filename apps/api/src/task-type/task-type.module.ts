import { Module } from '@nestjs/common';
import { TaskTypeController } from './task-type.controller';

@Module({
  controllers: [TaskTypeController]
})
export class TaskTypeModule {}
