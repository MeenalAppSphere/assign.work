import { BaseService } from '../base.service';
import { BoardModel, DbCollection } from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { GeneralService } from '../general.service';
import { BoardUtilityService } from './board.utility.service';
import { ProjectService } from '../project/project.service';

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

  async createBoard(model: BoardModel) {
    return this.withRetrySession(async (session: ClientSession) => {
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      // check basic validations
      this._utilityService.checkValidations(model);

      // start board creating process
      const defaultStatuses = projectDetails.settings.status.find(status => status.isDefault);
    });
  }
}
