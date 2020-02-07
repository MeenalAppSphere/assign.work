import { BaseService } from '../base.service';
import { BoardModel, DbCollection, GetActiveBoardRequestModel, Project } from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { GeneralService } from '../general.service';
import { BoardUtilityService } from './board.utility.service';
import { ProjectService } from '../project/project.service';
import { BadRequest } from '../../helpers/helpers';

export class BoardService extends BaseService<BoardModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;

  private _utilityService: BoardUtilityService;

  constructor(
    @InjectModel(DbCollection.board) protected readonly _boardModel: Model<BoardModel & Document>,
    private readonly _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_boardModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
    this._utilityService = new BoardUtilityService();
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
        populate: [{
          path: 'columns.headerStatus'
        }, { path: 'columns.includedStatuses' }, {
          path: 'columns.defaultAssignee',
          select: 'firstName lastName emailId userName profilePic'
        }]
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

}
