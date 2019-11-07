import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskHistoryService } from '../shared/services/task-history.service';
import { Schema } from 'mongoose';

@Controller('task-history')
@UseGuards(AuthGuard('jwt'))
export class TaskHistoryController {
  constructor(private readonly _taskHistoryService: TaskHistoryService) {

  }

  @Get(':id')
  async getAll(@Param('id') id: string) {
    return await this._taskHistoryService.find({ taskId: id }, [{
      path: 'task',
      select: 'name displayName',
      justOne: true
    }, {
      path: 'createdBy',
      select: 'emailId userName firstName lastName -_id',
      justOne: true
    }]);
  }
}
