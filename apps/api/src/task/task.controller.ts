import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from '../shared/services/task.service';
import { Task, TaskComments, TaskFilterDto } from '@aavantan-app/models';

const taskBasicPopulation: any[] = [{
  path: 'project',
  select: 'name description settings -_id',
  justOne: true
}, {
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

  @Get()
  async getAll() {
    return await this._taskService.getAllTasks({}, taskBasicPopulation);
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
  async deleteProject(@Param('id') id: string) {
    return await this._taskService.delete(id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this._taskService.findById(id, taskBasicPopulation);
  }

  @Post('')
  async getTask(@Body() filterModel: TaskFilterDto) {
    return await this._taskService.getTasks(filterModel);
  }
}
