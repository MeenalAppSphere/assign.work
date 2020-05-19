import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskStatusService } from '../shared/services/task-status/task-status.service';
import { TaskStatusModel } from '@aavantan-app/models';

@Controller('task-status')
@UseGuards(AuthGuard('jwt'))
export class TaskStatusController {

  constructor(private readonly _taskStatusService: TaskStatusService) {
  }

  @Post('create')
  async createTaskStatus(@Body() model: TaskStatusModel) {
    return await this._taskStatusService.addUpdate(model);
  }

  @Post('update')
  async updateTaskStatus(@Body() model: TaskStatusModel) {
    return await this._taskStatusService.addUpdate(model);
  }

  @Post('get-all')
  async getAllTaskStatues(@Body('projectId') projectId: string) {
    return await this._taskStatusService.getAllStatues(projectId);
  }

  @Post('add-default-color')
  async addMissingColorField() {
    return await this._taskStatusService.addMissingColorFiled();
  }
}
