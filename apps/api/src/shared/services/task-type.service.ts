import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from './base.service';
import { DbCollection, TaskType } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TaskTypeService extends BaseService<TaskType & Document> implements OnModuleInit {
  constructor(
    @InjectModel(DbCollection.taskType) private readonly _taskTypeModel: Model<TaskType & Document>
  ) {
    super(_taskTypeModel);
  }

  onModuleInit(): any {

  }
}
