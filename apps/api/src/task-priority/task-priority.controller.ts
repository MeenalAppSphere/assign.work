import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskPriorityService } from '../shared/services/task-priority/task-priority.service';
import { TaskPriorityModel } from '@aavantan-app/models';
import { RolesGuard } from '../shared/guard/roles.gaurd';
import { Roles } from '../shared/guard/roles.decorators';

@Controller('task-priority')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TaskPriorityController {
  constructor(private readonly _taskPriorityService: TaskPriorityService) {
  }

  @Post('create')
  @Roles('priority','canAdd_priority')
  async createTaskPriority(@Body() model: TaskPriorityModel) {
    return await this._taskPriorityService.addUpdate(model);
  }

  @Post('update')
  @Roles('priority','canModify_priority')
  async updateTaskPriorit(@Body() model: TaskPriorityModel) {
    return await this._taskPriorityService.addUpdate(model);
  }

  @Post('get-all')
  async getAllTaskPriorities(@Body('projectId') projectId: string) {
    return await this._taskPriorityService.getAllTaskPriorities(projectId);
  }
}
