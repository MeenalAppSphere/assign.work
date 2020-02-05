import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskTypeService } from '../shared/services/task-type/task-type.service';

@Controller('task-type')
@UseGuards(AuthGuard('jwt'))
export class TaskTypeController {
  constructor(private readonly _taskTypeService: TaskTypeService) {
  }

  @Post('get-all')
  async getAllTaskType(@Body('projectId') projectId: string) {
    return await this._taskTypeService.getAllTaskTypes(projectId);
  }
}
