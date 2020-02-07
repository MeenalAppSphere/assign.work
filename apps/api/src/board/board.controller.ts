import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetActiveBoardRequestModel } from '@aavantan-app/models';
import { BoardService } from '../shared/services/board/board.service';

@Controller('board')
@UseGuards(AuthGuard('jwt'))
export class BoardController {

  constructor(private readonly _boardService: BoardService) {
  }

  // @Post('create')
  // async createTaskStatus(@Body() model: TaskStatusModel) {
  //   return await this._taskStatusService.addUpdate(model);
  // }

  // @Post('update')
  // async updateTaskStatus(@Body() model: TaskStatusModel) {
  //   return await this._taskStatusService.addUpdate(model);
  // }

  @Post('get-all')
  async getAllTaskStatues(@Body('projectId') projectId: string) {
    return await this._boardService.getAll(projectId);
  }

  @Post('get-active-board')
  async getActiveBoard(@Body() model: GetActiveBoardRequestModel) {
    return await this._boardService.getBoardById(model);
  }
}
