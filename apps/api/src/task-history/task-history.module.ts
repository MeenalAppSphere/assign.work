import { Module } from '@nestjs/common';
import { TaskHistoryController } from './task-history.controller';

@Module({
  controllers: [TaskHistoryController],
  providers: []
})
export class TaskHistoryModule {}
