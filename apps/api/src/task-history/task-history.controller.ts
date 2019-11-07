import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskHistoryService } from '../shared/services/task-history.service';

@Controller('task-history')
@UseGuards(AuthGuard('jwt'))
export class TaskHistoryController {
  constructor(private readonly _taskHistoryService: TaskHistoryService) {

  }

  @Get(':id')
  async getAll(@Param('id') id: string) {
    return await this._taskHistoryService.getAll({ taskId: id }, []);
  }
}
