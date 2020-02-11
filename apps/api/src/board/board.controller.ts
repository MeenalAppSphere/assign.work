import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardHideColumnStatus,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardModelBaseRequest,
  BoardShowColumnStatus,
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

  @Post('merge-status-to-column')
  async mergeStatusToColumn(@Body() model: BoardMergeStatusToColumn) {
    return await this._boardService.mergeStatusToColumn(model);
  }

  @Post('merge-column-to-column')
  async mergeColumnToColumn(@Body() model: BoardMergeColumnToColumn) {
    return await this._boardService.mergeColumnToColumn(model);
  }

  @Post('show-column-status')
  async showColumnStatus(@Body() model: BoardShowColumnStatus) {
    return await this._boardService.showColumnStatus(model);
  }

  @Post('hide-column-status')
  async hideColumnStatus(@Body() model: BoardHideColumnStatus) {
    return await this._boardService.hideColumnStatus(model);
  }

  @Post('get-hidden-statuses')
  async getAllHiddenStatuses(@Body() model: BoardModelBaseRequest) {
    return await this._boardService.getAllHiddenStatusesOfABoard(model);
  }

  @Post('add-default-assignee')
  async addDefaultAssignee(@Body() model: BoardAssignDefaultAssigneeToStatusModel) {
    return await this._boardService.addDefaultAssigneeToStatus(model);
  }
}
