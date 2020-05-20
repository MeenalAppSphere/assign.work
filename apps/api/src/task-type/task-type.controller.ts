import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskTypeService } from '../shared/services/task-type/task-type.service';
import { TaskTypeModel } from '@aavantan-app/models';

@Controller('task-type')
@UseGuards(AuthGuard('jwt'))
export class TaskTypeController {
  constructor(private readonly _taskTypeService: TaskTypeService) {
  }

  @Post('create')
  async createTaskType(@Body() model: TaskTypeModel) {
    return await this._taskTypeService.addUpdate(model);
  }

  @Post('update')
  async updateTaskType(@Body() model: TaskTypeModel) {
    return await this._taskTypeService.addUpdate(model);
  }

  @Post('get-all')
  async getAllTaskType(@Body('projectId') projectId: string) {
    return await this._taskTypeService.getAllTaskTypes(projectId);
  }

  @Post('add-missing-default-assignee')
  async addMissingAssigneeFiled() {
    return await this._taskTypeService.addMissingAssigneeFiled();
  }
}
