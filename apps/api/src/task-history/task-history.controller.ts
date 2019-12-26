import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskHistoryService } from '../shared/services/task-history.service';
import { GetTaskHistoryModel } from '@aavantan-app/models';

@Controller('task-history')
@UseGuards(AuthGuard('jwt'))
export class TaskHistoryController {
  constructor(private readonly _taskHistoryService: TaskHistoryService) {

  }

  @Post('get-history')
  async getAll(@Body() model: GetTaskHistoryModel) {
    model.populate = [{
      path: 'createdBy',
      select: 'emailId userName firstName lastName -_id',
      justOne: true
    }];
    return await this._taskHistoryService.getTaskHistory(model);
  }
}
