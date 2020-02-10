import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardShowHideColumn,
  GetActiveBoardRequestModel
} from '@aavantan-app/models';
import { BoardService } from '../shared/services/board/board.service';

@Controller('board')
@UseGuards(AuthGuard('jwt'))
export class BoardController {

  constructor(private readonly _boardService: BoardService) {
  }

  @Post('create')
  async createBoard(@Body() model: BoardModel) {
    return await this._boardService.createNewBoard(model);
  }

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

  @Post('add-column')
  async addColumn(@Body() model: BoardAddNewColumnModel) {
    return await this._boardService.addNewColumn(model);
  }

  @Post('merge-status')
  async mergeStatusToColumn(@Body() model: BoardMergeStatusToColumn) {
    return await this._boardService.mergeStatusToColumn(model);
  }

  @Post('show-hide-column')
  async showHideColumn(@Body() model: BoardShowHideColumn) {
    return await this._boardService.showHideColumn(model);
  }

  @Post('add-default-assignee')
  async addDefaultAssignee(@Body() model: BoardAssignDefaultAssigneeToStatusModel) {
    return await this._boardService.addDefaultAssigneeToStatus(model);
  }
}
