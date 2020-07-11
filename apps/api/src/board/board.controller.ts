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
import { RolesGuard } from '../shared/guard/roles.gaurd';

@Controller('board')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BoardController {

  constructor(private readonly _boardService: BoardService) {
  }

  @Post('create')
  @Roles('boardSettings','canAddBoardSettings_board')
  async createBoard(@Body() model: BoardModel) {
    return await this._boardService.createUpdateBoard(model);
  }

  @Post('update')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async updateBoard(@Body() model: BoardModel) {
    return await this._boardService.createUpdateBoard(model);
  }

  @Post('publish')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async publishBoard(@Body() model: SaveAndPublishBoardModel) {
    return await this._boardService.saveAndPublishBoard(model);
  }

  @Post('save-publish')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async saveAndPublishBoard(@Body() model: SaveAndPublishBoardModel) {
    return await this._boardService.saveAndPublishBoard(model);
  }

  @Post('delete')
  @Roles('boardSettings', 'canRemoveBoardSettings_board')
  async deleteBoard(@Body() model: BoardModelBaseRequest) {
    return await this._boardService.deleteBoard(model);
  }

  @Post('get-all')
  async getAllBoards(@Body() requestModel: GetAllBoardsRequestModel) {
    return this._boardService.getAllBoards(requestModel);
  }

  @Post('get-active-board')
  @Roles('boardSettings', 'canViewBoardSettings_board')
  async getActiveBoard(@Body() model: GetActiveBoardRequestModel) {
    return await this._boardService.getBoardById(model);
  }

  @Post('add-column')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async addColumn(@Body() model: BoardAddNewColumnModel) {
    return await this._boardService.addNewColumn(model);
  }

  @Post('merge-status-to-column')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async mergeStatusToColumn(@Body() model: BoardMergeStatusToColumn) {
    return await this._boardService.mergeStatusToColumn(model);
  }

  @Post('merge-column-to-column')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async mergeColumnToColumn(@Body() model: BoardMergeColumnToColumn) {
    return await this._boardService.mergeColumnToColumn(model);
  }

  @Post('hide-board-column')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async hideBoardColumn(@Body() model: BoardHideColumnModel) {
    return await this._boardService.hideColumn(model);
  }

  @Post('show-column-status')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async showColumnStatus(@Body() model: BoardShowColumnStatus) {
    return await this._boardService.showColumnStatus(model);
  }

  @Post('hide-column-status')
  @Roles('boardSettings', 'canModifyBoardSettings_board')
  async hideColumnStatus(@Body() model: BoardHideColumnStatus) {
    return await this._boardService.hideColumnStatus(model);
  }

  @Post('get-hidden-statuses')
  @Roles('boardSettings', 'canViewBoardSettings_board')
  async getAllHiddenStatuses(@Body() model: BoardModelBaseRequest) {
    return await this._boardService.getAllHiddenStatusesOfABoard(model);
  }

  @Post('add-default-assignee')
  async addDefaultAssignee(@Body() model: BoardAssignDefaultAssigneeToStatusModel) {
    return await this._boardService.addDefaultAssigneeToStatus(model);
  }
}
