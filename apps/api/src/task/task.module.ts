import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskGateway } from './task.gateway';

@Module({
  controllers: [TaskController],
  providers: [
    TaskGateway
  ]
})
export class TaskModule {
}
