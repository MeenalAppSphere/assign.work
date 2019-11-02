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
import { Project, Task, TaskComments } from '@aavantan-app/models';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('task')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly _taskService: TaskService) {

  }

  @Get()
  async getAll() {
    return await this._taskService.getAll({}, []);
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

  }

  @Delete(':id')
  async deleteProject(@Param() id: string) {
    return await this._taskService.delete(id);
  }

}
