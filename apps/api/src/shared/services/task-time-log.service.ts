import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { AddTaskTimeModel, DbCollection, Project, Task, TaskTimeLog, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';
import { stringToSeconds } from '../helpers/helpers';

@Injectable()
export class TaskTimeLogService extends BaseService<TaskTimeLog & Document> {
  constructor(
    @InjectModel(DbCollection.taskTimeLog) protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>,
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private readonly _generalService: GeneralService
  ) {
    super(_taskTimeLogModel);
  }

  async addTimeLog(model: AddTaskTimeModel) {
    if (!model) {
      throw new BadRequestException('invalid json');
    }
    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.timeLog.taskId);

    // validation
    if (!model.timeLog.createdById) {
      throw new BadRequestException('Please select Created By');
    }

    if (!model.timeLog.loggedTimeReadable) {
      throw new BadRequestException('Please add Spent Time');
    }

    if (!model.timeLog.remainingTimeReadable) {
      throw new BadRequestException('Please add Remaining Time');
    }

    if (!model.timeLog.desc) {
      throw new BadRequestException('Please add Description');
    }

    if (!model.timeLog.startedAt) {
      throw new BadRequestException('Please select Start date');
    }

    if (!model.timeLog.endAt) {
      throw new BadRequestException('Please select End date');
    }

    const isStartedAtBeforeTaskCreatedAt = moment(model.timeLog.startedAt).isBefore(taskDetails.createdAt);
    if (isStartedAtBeforeTaskCreatedAt) {
      throw new BadRequestException('Started Date can not be before Task Creation Date');
    }

    const isStartDateGraterThenEndDate = moment(model.timeLog.startedAt).isAfter(model.timeLog.endAt);
    if (isStartDateGraterThenEndDate) {
      throw new BadRequestException('Started Date can not be after End Date');
    }

    const session = await this._taskTimeLogModel.db.startSession();
    session.startTransaction();

    model.timeLog.loggedTime = stringToSeconds(model.timeLog.loggedTimeReadable);
    model.timeLog.remainingTime = stringToSeconds(model.timeLog.remainingTimeReadable);

    try {
      // add task log to db
      await this._taskTimeLogModel.create([model.timeLog], session);

      // update task
      taskDetails.totalLoggedTime = (taskDetails.totalLoggedTime || 0) + model.timeLog.loggedTime || 0;

      if (!taskDetails.estimatedTime) {
        // if not estimate time means one haven't added any estimate so progress will be 100 %
        taskDetails.progress = 100;
      } else {
        taskDetails.progress = ((100 * taskDetails.totalLoggedTime) / taskDetails.estimatedTime);
      }

      // update task total logged time and total estimated time
      await this._taskModel.updateOne({ _id: this.toObjectId(model.timeLog.taskId) }, taskDetails, session);

      await session.commitTransaction();
      session.endSession();
      return {
        taskId: model.timeLog.taskId,
        progress: taskDetails.progress,
        totalEstimatedTime: taskDetails.estimatedTime,
        totalLoggedTime: taskDetails.totalLoggedTime
      };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async getAllLogs(model): Promise<TaskTimeLog[]> {
    const projectDetails = await this.getProjectDetails(model.projectId);

    return this._taskTimeLogModel.find({
      taskId: this.toObjectId(model.taskId),
      isDeleted: false
    }).populate({
      path: 'createdBy',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }).lean(true);
  }

  private async getProjectDetails(id: string): Promise<Project> {
    const projectDetails: Project = await this._projectModel.findById(id).select('members settings createdBy updatedBy').lean().exec();

    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
    } else {
      const isMember = projectDetails.members.some(s => s.userId === this._generalService.userId) || (projectDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

      if (!isMember) {
        throw new BadRequestException('You are not a part of Project');
      }
    }
    return projectDetails;
  }

  private async getTaskDetails(id: string): Promise<Task> {
    const taskDetails: Task = await this._taskModel.findOne({
      _id: this.toObjectId(id),
      isDeleted: false
    }).lean().exec();

    if (!taskDetails) {
      throw new NotFoundException('No Task Found');
    }
    return taskDetails;
  }
}
