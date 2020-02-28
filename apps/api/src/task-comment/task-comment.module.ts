import { Module } from '@nestjs/common';
import { TaskCommentController } from './task-comment.controller';

@Module({
  controllers: [TaskCommentController]
})
export class TaskCommentModule {
}
