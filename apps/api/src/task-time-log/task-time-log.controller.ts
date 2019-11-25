import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskTimeLogService } from '../shared/services/task-time-log.service';
import { AddTaskTimeModel } from '@aavantan-app/models';

@Controller('task-time-log')
@UseGuards(AuthGuard('jwt'))
export class TaskTimeLogController {
  constructor(private readonly _taskTimeLogService: TaskTimeLogService) {

  }

  @Post('log')
  async logTime(@Body() model: AddTaskTimeModel) {
    return await this._taskTimeLogService.addTimeLog(model);
  }
}
