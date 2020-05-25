import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardHideColumnModel,
  BoardHideColumnStatus,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardModelBaseRequest,
  BoardShowColumnStatus,
  GetActiveBoardRequestModel,
  GetAllBoardsRequestModel, SaveAndPublishBoardModel
} from '@aavantan-app/models';
import { BoardService } from '../shared/services/board/board.service';
import { Roles } from '../shared/guard/roles.decorators';

@Controller('board')
@UseGuards(AuthGuard('jwt'))
export class BoardController {

  constructor(private readonly _boardService: BoardService) {
  }

  @Post('create')
  async createBoard(@Body() model: BoardModel) {
    return await this._boardService.createUpdateBoard(model);
  }

  @Post('update')
  @Roles('board', 'canAdd')
  async updateBoard(@Body() model: BoardModel) {
    return await this._boardService.createUpdateBoard(model);
  }

  @Post('publish')
  async publishBoard(@Body() model: SaveAndPublishBoardModel) {
    return await this._boardService.saveAndPublishBoard(model);
  }

  @Post('save-publish')
  async saveAndPublishBoard(@Body() model: SaveAndPublishBoardModel) {
    return await this._boardService.saveAndPublishBoard(model);
  }

  @Post('delete')
  async deleteBoard(@Body() model: BoardModelBaseRequest) {
    return await this._boardService.deleteBoard(model);
  }

  @Post('get-all')
  async getAllBoards(@Body() requestModel: GetAllBoardsRequestModel) {
    return this._boardService.getAllBoards(requestModel);
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

  @Post('hide-board-column')
  async hideBoardColumn(@Body() model: BoardHideColumnModel) {
    return await this._boardService.hideColumn(model);
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
