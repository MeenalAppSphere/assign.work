import { BaseService } from '../base.service';
import {
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardColumnIncludedStatus,
  BoardColumns,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardShowHideColumn,
  DbCollection,
  GetActiveBoardRequestModel,
  MongooseQueryModel,
  Project
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { GeneralService } from '../general.service';
import { BoardUtilityService } from './board.utility.service';
import { ProjectService } from '../project/project.service';
import { BadRequest } from '../../helpers/helpers';
import { ProjectUtilityService } from '../project/project.utility.service';

const detailsBoardPopulationObject = [{
  path: 'columns.headerStatus', select: 'name _id'
}, { path: 'columns.includedStatuses.status', select: 'name _id' }, {
  path: 'columns.includedStatuses.defaultAssignee',
  select: 'firstName lastName emailId userName profilePic'
}];

export class BoardService extends BaseService<BoardModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;

  private _utilityService: BoardUtilityService;
  private _projectUtilityService: ProjectUtilityService;

  constructor(
    @InjectModel(DbCollection.board) protected readonly _boardModel: Model<BoardModel & Document>,
    private readonly _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_boardModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new BoardUtilityService();
    this._projectUtilityService = new ProjectUtilityService();
  }

  /**
   * create default board
   * create board with default status which are created with new project
   * @param project
   * @param session
   */
  async createDefaultBoard(project: Project, session: ClientSession) {
    const board = this._utilityService.prepareDefaultBoardModel(project);
    return await this.create([board], session);
  }

  /**
   * create a new column from a status
   * @param requestModel
   */
  async addNewColumn(requestModel: BoardAddNewColumnModel) {
    await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      await this._projectService.getProjectDetails(requestModel.projectId);
      // get board details
      const boardDetails = await this.getDetails(requestModel.boardId, requestModel.projectId);
      let column = new BoardColumns();

      // check if already a column
      const isAlreadyAColumnIndex = this._utilityService.getColumnIndex(boardDetails.columns, requestModel.statusId);
      if (isAlreadyAColumnIndex > -1) {
        column = boardDetails.columns.splice(isAlreadyAColumnIndex, 1)[0];

        // add column at a specific index
        this._utilityService.addColumnAtSpecificIndex(boardDetails, requestModel.columnIndex, column);
      } else {
        // if not a column then move if a status which is already merged
        // check if status is already merged in a column
        const columnIndex = this._utilityService.getColumnIndexFromStatus(boardDetails, requestModel.statusId);

        if (columnIndex > -1) {
          // if already merged in column than un-merge / remove it from that column
          this._utilityService.unMergeStatusFromAColumn(boardDetails, columnIndex, requestModel.statusId);
        }

        // create new column object
        column.headerStatusId = requestModel.statusId;
        column.includedStatuses = [{ statusId: requestModel.statusId, defaultAssigneeId: this._generalService.userId }];
        column.columnColor = '';
        column.columnOrderNo = requestModel.columnIndex + 1;

        // add column at a specific index
        this._utilityService.addColumnAtSpecificIndex(boardDetails, requestModel.columnIndex, column);
      }

      // reassign column order no
      boardDetails.columns = this._utilityService.reassignColumnOrderNo(boardDetails);

      // update board by id and set columns
      await this.updateById(requestModel.boardId, {
        $set: { columns: boardDetails.columns }
      }, session);
    });

    return await this.getDetails(requestModel.boardId, requestModel.projectId, true);
  }

  /**
   * merge status to column
   * @param requestModel
   */
  async mergeStatusToColumn(requestModel: BoardMergeStatusToColumn) {
    await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      await this._projectService.getProjectDetails(requestModel.projectId);
      // get board details
      const boardDetails = await this.getDetails(requestModel.boardId, requestModel.projectId);

      // get new column index where element is dropped
      const nextColumnIndex = this._utilityService.getColumnIndex(boardDetails.columns, requestModel.nextColumnId);
      if (nextColumnIndex === -1) {
        BadRequest('Column not found where to move');
      }

      // check status id present or not
      if (!requestModel.statusId) {
        BadRequest('Status not found to move');
      }

      // if column id and status id both are same then don't do any thing just return it
      if (requestModel.nextColumnId === requestModel.statusId) {
        return;
      }

      // get column where this status already exists
      const previousColumnIndex = this._utilityService.getColumnIndexFromStatus(boardDetails, requestModel.statusId);
      let newStatus: BoardColumnIncludedStatus = new BoardColumnIncludedStatus();
      if (previousColumnIndex > -1) {

        // get status index from the founded column
        const statusIndex = this._utilityService.getStatusIndex(boardDetails.columns, previousColumnIndex, requestModel.statusId);
        if (statusIndex > -1) {

          // get status from previous status
          newStatus = boardDetails.columns[previousColumnIndex].includedStatuses[statusIndex];

          // remove status from previous column
          this._utilityService.unMergeStatusFromAColumn(boardDetails, previousColumnIndex, requestModel.statusId);

          // add status to new column
          boardDetails.columns[nextColumnIndex].includedStatuses.push(newStatus);

          // if previous column don't have any status then remove it from board
          if (!boardDetails.columns[previousColumnIndex].includedStatuses.length) {
            this._utilityService.removeColumnFromBoard(boardDetails, previousColumnIndex);
          }

        } else {
          // status not found
          BadRequest('Status not found from a column');
        }
      } else {
        // status not included in any column create new BoardColumnIncludedStatus an push it to next column
        newStatus.statusId = requestModel.statusId;
        newStatus.defaultAssigneeId = this._generalService.userId;

        // add status to new column
        boardDetails.columns[nextColumnIndex].includedStatuses.push(newStatus);
      }

      // reassign column order no
      boardDetails.columns = this._utilityService.reassignColumnOrderNo(boardDetails);

      // update board by id and set columns
      return await this.updateById(requestModel.boardId, {
        $set: { columns: boardDetails.columns }
      }, session);

    });

    return await this.getDetails(requestModel.boardId, requestModel.projectId, true);
  }

  /**
   * merge column to column
   * @param requestModel
   */
  async mergeColumnToColumn(requestModel: BoardMergeColumnToColumn) {
    await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      await this._projectService.getProjectDetails(requestModel.projectId);

      if (requestModel.nextColumnId === requestModel.columnId) {
        BadRequest('Can not Merge Column to same Column');
      }

      // get board details
      const boardDetails = await this.getDetails(requestModel.boardId, requestModel.projectId);

      // get new column index where element is dropped
      const nextColumnIndex = this._utilityService.getColumnIndex(boardDetails.columns, requestModel.nextColumnId);
      if (nextColumnIndex === -1) {
        BadRequest('Next column not found');
      }

      // ensure that moving element is column or status
      const previousColumnIndex = this._utilityService.getColumnIndex(boardDetails.columns, requestModel.columnId);
      if (previousColumnIndex > -1) {
        // moving a column
        const previousColumn = boardDetails.columns[previousColumnIndex];

        // move found column to new column as status
        boardDetails.columns[nextColumnIndex].includedStatuses.push(...previousColumn.includedStatuses);

        // remove previous column from board
        this._utilityService.removeColumnFromBoard(boardDetails, previousColumnIndex);
      } else {
        // column not found
        BadRequest('Column not found...');
      }

      // reassign column order no
      boardDetails.columns = this._utilityService.reassignColumnOrderNo(boardDetails);

      // update board by id and set columns
      await this.updateById(requestModel.boardId, {
        $set: { columns: boardDetails.columns }
      }, session);

    });

    return await this.getDetails(requestModel.boardId, requestModel.projectId, true);
  }

  /**
   * show / hides a column on board
   * @param requestModel
   */
  async showHideColumn(requestModel: BoardShowHideColumn) {
    await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      await this._projectService.getProjectDetails(requestModel.projectId);
      // get board details
      const boardDetails = await this.getDetails(requestModel.boardId, requestModel.projectId);

      // get column index from columns array
      const columnIndex = this._utilityService.getColumnIndex(boardDetails.columns, requestModel.columnId);

      if (columnIndex === -1) {
        BadRequest('Column not found');
      }

      // update board and set column active or de-active
      await this.updateById(requestModel.boardId, {
        $set: {
          [`columns.${columnIndex}.isActive`]: requestModel.isShown
        }
      }, session);
    });

    return await this.getDetails(requestModel.boardId, requestModel.projectId, true);
  }

  /**
   * add default assignee to a status
   */
  async addDefaultAssigneeToStatus(requestModel: BoardAssignDefaultAssigneeToStatusModel) {
    await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(requestModel.projectId);
      // get board details
      const boardDetails = await this.getDetails(requestModel.boardId, requestModel.projectId);

      // get column index from columns array
      const columnIndex = this._utilityService.getColumnIndex(boardDetails.columns, requestModel.columnId);

      if (columnIndex === -1) {
        BadRequest('Column not found');
      }

      // get status index from a column
      const statusIndex = this._utilityService.getStatusIndex(boardDetails.columns, columnIndex, requestModel.statusId);

      if (statusIndex === -1) {
        BadRequest('Status not found in column');
      }

      // check if assignee is part or project
      if (!this._projectUtilityService.userPartOfProject(requestModel.assigneeId, projectDetails)) {
        BadRequest('User not found or user is not a part of Project');
      }

      const updateDocObject = {
        [`columns.${columnIndex}.includedStatuses.${statusIndex}.defaultAssigneeId`]: requestModel.assigneeId
      };

      // update board and set default assignee for a status
      await this.updateById(requestModel.boardId, {
        $set: updateDocObject
      }, session);
    });

    return await this.getDetails(requestModel.boardId, requestModel.projectId, true);
  }

  /**
   * create a new board
   * @param board
   */
  async createNewBoard(board: BoardModel) {
    return this.withRetrySession(async (session: ClientSession) => {
      await this._projectService.getProjectDetails(board.projectId);

      // check validations
      this._utilityService.checkValidations(board);

      // check is duplicate name
      if (await this.isDuplicate(board)) {
        BadRequest('Duplicate board name is not allowed');
      }

      // create a new board model
      const boardModel = new BoardModel();
      boardModel.createdById = this._generalService.userId;
      boardModel.name = board.name;
      boardModel.projectId = board.projectId;

      // create and return new bord
      return await this.create([boardModel], session);
    });
  }

  /**
   * is duplicate board
   * @param board
   * @param exceptThis
   */
  private async isDuplicate(board: BoardModel, exceptThis?: string): Promise<boolean> {
    const queryFilter = {
      projectId: board.projectId, name: { $regex: `^${board.name.trim()}$`, $options: 'i' }
    };

    if (exceptThis) {
      queryFilter['_id'] = { $ne: exceptThis };
    }

    const queryResult = await this.find({
      filter: queryFilter
    });

    return !!(queryResult && queryResult.length);
  }

  /**
   * get board by id
   * @param model
   */
  async getBoardById(model: GetActiveBoardRequestModel) {
    try {
      await this._projectService.getProjectDetails(model.projectId);

      if (!this.isValidObjectId(model.boardId)) {
        BadRequest('Board not found...');
      }

      const board = await this.findOne({
        filter: { projectId: model.projectId, _id: model.boardId },
        lean: true,
        populate: detailsBoardPopulationObject
      });

      if (board) {
        return this._utilityService.convertToVm(board);
      } else {
        BadRequest('Board not found...');
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * get board details by id
   * @param boardId
   * @param projectId
   * @param getFullDetails
   */
  async getDetails(boardId: string, projectId: string, getFullDetails: boolean = false) {
    if (!this.isValidObjectId(boardId)) {
      throw new NotFoundException('Board not found');
    }

    const queryModel = new MongooseQueryModel();
    queryModel.filter = { _id: boardId, projectId: projectId };
    queryModel.lean = true;

    if (getFullDetails) {
      queryModel.populate = detailsBoardPopulationObject;
    }

    const board = await this.findOne(queryModel);

    if (!board) {
      throw new NotFoundException('Board not found');
    } else {
      return this._utilityService.convertToVm(board);
    }
  }

}
