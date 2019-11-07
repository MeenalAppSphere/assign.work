import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put, UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from '../shared/services/task.service';
import { Project, Task, TaskComments, TaskFilterDto } from '@aavantan-app/models';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('task')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly _taskService: TaskService) {

  }

  @Get()
  async getAll() {
    return await this._taskService.getAllTasks({}, [{
      path: 'project',
      select: 'name description settings -_id'
    }, {
      path: 'createdBy',
      select: 'emailId userName firstName lastName -_id'
    }, {
      path: 'assignee',
      select: 'emailId userName firstName lastName -_id'
    }]);
  }

  @Post()
  async createTask(@Body() task: Task) {
    return await this._taskService.addTask(task);
  }

  @Put(':id')
  async updateTask(@Param('id') id: string, @Body() task: Task) {
    return await this._taskService.updateTask(id, task);
  }

  @Post(':id/add-comment')
  async addComment(@Param('id') id: string, @Body() comment: TaskComments) {
    return await this._taskService.addComment(id, comment);
  }

  @Post(':id/update-comment')
  async updateComment(@Param('id') id: string, @Body() comment: TaskComments) {
    return await this._taskService.updateComment(id, comment);
  }

  @Post(':id/pin-comment')
  async pinComment(@Param('id') id: string, @Param('commentId') commentId: string, isPinned: boolean) {
    return await this._taskService.pinComment(id, commentId, isPinned);
  }

  @Delete(':id')
  async deleteProject(@Param() id: string) {
    return await this._taskService.delete(id);
  }

  @Post('')
  async getTask(@Body() filterModel: TaskFilterDto) {
    return await this._taskService.getTasks(filterModel);
  }
}
