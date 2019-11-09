import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from '../shared/services/task.service';
import { Task, TaskComments, TaskFilterDto, User } from '@aavantan-app/models';

const taskBasicPopulation: any[] = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName -_id',
  justOne: true
}, {
  path: 'assignee',
  select: 'emailId userName firstName lastName -_id',
  justOne: true
}];

@Controller('task')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly _taskService: TaskService) {

  }

  @Post('get-all')
  async getAll(@Body('projectId') projectId: string) {
    return await this._taskService.getAllTasks(projectId, taskBasicPopulation);
  }

  @Get('my-task/:projectId')
  async getMyTasks(@Param('projectId') projectId: string) {
    return await this._taskService.getMyTask(projectId, taskBasicPopulation);
  }

  @Post()
  async createTask(@Body() task: Task) {
    return await this._taskService.addTask(task);
  }

  @Put(':id')
  async updateTask(@Param('id') id: string, @Body() task: Task) {
    return await this._taskService.updateTask(id, task);
  }

  @Get(':id/get-comments')
  async getComments(@Param('id') id: string) {
    return await this._taskService.getComments(id);
  }

  @Post(':id/add-comment')
  async addComment(@Param('id') id: string, @Body() comment: TaskComments, @Request() req) {
    return await this._taskService.addComment(id, comment);
  }

  @Post(':id/update-comment')
  async updateComment(@Param('id') id: string, @Body() comment: TaskComments) {
    return await this._taskService.updateComment(id, comment);
  }

  @Post(':id/pin-comment')
  async pinComment(@Param('id') id: string, @Body() request: { commentId: string, isPinned: boolean }) {
    return await this._taskService.pinComment(id, request);
  }

  @Delete(':id/delete-comment/:commentId')
  async deleteComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    return await this._taskService.deleteComment(id, commentId);
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string) {
    return await this._taskService.delete(id);
  }

  @Get(':projectId/:query')
  async getByIdOrDisplayName(@Param('query') projectId: string, @Param('query') query: string) {
    return this._taskService.getTaskByIdOrDisplayName(projectId, query, taskBasicPopulation);
  }

  @Post('filter')
  async getTask(@Body() filterModel: TaskFilterDto) {
    return await this._taskService.getTasks(filterModel, taskBasicPopulation);
  }
}
