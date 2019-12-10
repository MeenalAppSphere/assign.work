import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { CreateSprintModel, DbCollection, Sprint } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';

@Injectable()
export class SprintService extends BaseService<Sprint & Document> {
  constructor(
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    private _generalService: GeneralService
  ) {
    super(_sprintModel);
  }

  public createSprint(model: CreateSprintModel) {

  }
}
