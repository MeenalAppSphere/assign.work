import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskTypeService } from '../shared/services/task-type/task-type.service';
import { TaskTypeModel } from '@aavantan-app/models';
import { RolesGuard } from '../shared/guard/roles.gaurd';
import { Roles } from '../shared/guard/roles.decorators';

@Controller('task-type')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TaskTypeController {
  constructor(private readonly _taskTypeService: TaskTypeService) {
  }

  @Post('create')
  @Roles('task-type','canAdd_tasktype')
  async createTaskType(@Body() model: TaskTypeModel) {
    return await this._taskTypeService.addUpdate(model);
  }

  @Post('update')
  @Roles('task-type','canModify_tasktype')
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
