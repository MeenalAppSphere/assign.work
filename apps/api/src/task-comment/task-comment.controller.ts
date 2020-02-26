import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddCommentModel, CommentPinModel, TaskStatusModel, UpdateCommentModel } from '@aavantan-app/models';
import { TaskCommentService } from '../shared/services/task-comment/task-comment.service';

@Controller('task-comments')
@UseGuards(AuthGuard('jwt'))
export class TaskCommentController {

  constructor(private readonly _taskCommentService: TaskCommentService) {
  }

  @Post('add')
  async addComment(@Body() model: AddCommentModel) {
    return await this._taskCommentService.addComment(model);
  }

  @Post('update')
  async updateComment(@Body() model: UpdateCommentModel) {
    return await this._taskCommentService.updateComment(model);
  }

  @Post('get-all')
  async getAllComments(@Body('projectId') projectId: string, @Body('taskId') taskId: string) {
    return await this._taskCommentService.getAllTaskComments(projectId, taskId);
  }

  @Post('pin-comment')
  async pinComment(@Body() model: CommentPinModel) {
    return await this._taskCommentService.pinComment(model);
  }
}
