import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { AddTaskTimeModel, DbCollection, Project, Task, TaskTimeLog, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';

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
    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.timeLog.taskId);

    // validation
    if (!model.timeLog.createdBy) {
      throw new BadRequestException('Please select Created By');
    }

    if (!model.timeLog.loggedTime) {
      throw new BadRequestException('Please add Spent Time');
    }

    if (!model.timeLog.remainingTime) {
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

    try {
      await this._taskTimeLogModel.create([model], session);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
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
