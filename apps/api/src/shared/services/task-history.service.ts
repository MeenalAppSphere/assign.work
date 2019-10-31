import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { DbCollection, Task, TaskHistory } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TaskHistoryService extends BaseService<TaskHistory & Document> {
  constructor(
    @InjectModel(DbCollection.taskHistory) protected readonly _taskHistoryModel: Model<TaskHistory & Document>
  ) {
    super(_taskHistoryModel);
  }
}
