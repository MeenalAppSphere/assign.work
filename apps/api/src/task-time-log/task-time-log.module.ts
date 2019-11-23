import { Module } from '@nestjs/common';
import { TaskTimeLogController } from './task-time-log.controller';

@Module({
  controllers: [TaskTimeLogController]
})
export class TaskTimeLogModule {}
