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

  async createDefaultBoard(project: Project, session: ClientSession) {
    const board = this._utilityService.prepareDefaultBoardModel(project);
    return await this.create([board], session);
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
        }, { path: 'columns.includedStatus' }, {
          path: 'columns.defaultAssignee',
          select: 'firstName lastName emailId userName profilePic'
        }]
      });

      if (board) {
        board.id = board._id;
        return board;
      } else {
        BadRequest('Board not found...');
      }
    } catch (e) {
      throw e;
    }
  }

}
