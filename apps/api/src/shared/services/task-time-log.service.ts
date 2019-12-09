import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddTaskTimeModel,
  DbCollection,
  Project,
  Task,
  TaskHistory,
  TaskHistoryActionEnum,
  TaskTimeLog,
  TaskTimeLogResponse,
  User
} from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';
import { secondsToString, stringToSeconds } from '../helpers/helpers';
import { TaskHistoryService } from './task-history.service';

@Injectable()
export class TaskTimeLogService extends BaseService<TaskTimeLog & Document> {
  constructor(
    @InjectModel(DbCollection.taskTimeLog) protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>,
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private _taskHistoryService: TaskHistoryService, private readonly _generalService: GeneralService
  ) {
    super(_taskTimeLogModel);
  }

  /**
   * add time to log for task
   * @param model: model contains project id and timeLog model ( : TaskTimeLog )
   */
  async addTimeLog(model: AddTaskTimeModel): Promise<TaskTimeLogResponse> {
    if (!model) {
      throw new BadRequestException('invalid json');
    }
    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.timeLog.taskId);


    // region validations
    if (!model.timeLog.createdById) {
      throw new BadRequestException('Please add Created By');
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

    // if one have worked periodically then check end date is provided or not
    if (model.timeLog.isPeriod && !model.timeLog.endAt) {
      throw new BadRequestException('Please select End date');
    }

    // Started date validation is before task created date
    const isStartedAtBeforeTaskCreatedAt = moment(model.timeLog.startedAt).isBefore(taskDetails.createdAt);
    if (isStartedAtBeforeTaskCreatedAt) {
      throw new BadRequestException('Started Date can not be before Task Creation Date');
    }

    // check if one have worked periodically and logged time then check start and end date validations
    if (model.timeLog.isPeriod) {

      // Started date validation is after time log end date
      const isStartDateGraterThenEndDate = moment(model.timeLog.startedAt).isAfter(model.timeLog.endAt);
      if (isStartDateGraterThenEndDate) {
        throw new BadRequestException('Started Date can not be after End Date');
      }

      // End date validation is before task created date
      const isEndDateBeforeTaskCreatedAt = moment(model.timeLog.endAt).isBefore(taskDetails.createdAt);
      if (isEndDateBeforeTaskCreatedAt) {
        throw new BadRequestException('End Date can not be before Task Creation Date');
      }

      // End date validation is before time log start date
      const isEndDateBeforeThenStartDate = moment(model.timeLog.endAt).isBefore(model.timeLog.startedAt);
      if (isEndDateBeforeThenStartDate) {
        throw new BadRequestException('End Date can not be before Start Date');
      }

    }

    // endregion

    // convert logged time to seconds
    model.timeLog.loggedTime = stringToSeconds(model.timeLog.loggedTimeReadable);

    // region working capacity check

    // get user details from project members
    const userDetails = projectDetails.members.find(member => {
      return member.userId === model.timeLog.createdById;
    });

    // convert startedAt to date object
    const startedDate = moment(model.timeLog.startedAt);
    // convert endAt to date object, if isPeriod true else use startedAt
    const endDate = moment(model.timeLog.isPeriod ? model.timeLog.endAt : model.timeLog.startedAt);

    // find last logged items in between start and end date
    const lastLogs = await this._taskTimeLogModel.find({
      createdById: this.toObjectId(model.timeLog.createdById),
      startedAt: { '$gte': startedDate.startOf('day').toDate() },
      endAt: { '$lt': endDate.endOf('day').toDate() },
      isDeleted: false
    }).lean();

    // if last logs found
    // the one have already logged in between given start and end date
    if (lastLogs && lastLogs.length) {
      const totalLoggedTime = lastLogs.reduce((acc, cur) => {
        return acc + cur.loggedTime;
      }, 0);

      if (!model.timeLog.isPeriod) {
        // logged only for a certain day
        if ((totalLoggedTime + model.timeLog.loggedTime) > (userDetails.workingCapacityPerDay * 3600)) {
          throw new BadRequestException('your logging limit exceeded for Given date!');
        }
      } else {
        // logged for a period of a time

        // count for how many days one is logging
        // if count is 0 then one is logging is for the same date then mark it as 1
        const countTotalDay = startedDate.diff(endDate, 'd') || 1;

        // logged only for a multiple days ( periodically )
        if ((totalLoggedTime + model.timeLog.loggedTime) > ((userDetails.workingCapacityPerDay * countTotalDay) * 3600)) {
          throw new BadRequestException('your logging limit exceeded for Given dates!');
        }
      }
    }
    // endregion

    const session = await this._taskTimeLogModel.db.startSession();
    session.startTransaction();

    try {
      // add task log to db
      await this._taskTimeLogModel.create([model.timeLog], session);

      // region task logged time calculation
      taskDetails.totalLoggedTime = (taskDetails.totalLoggedTime || 0) + model.timeLog.loggedTime || 0;

      if (!taskDetails.estimatedTime) {
        // if not estimate time means one haven't added any estimate so progress will be 100 %
        taskDetails.progress = 100;
        model.timeLog.remainingTime = 0;
      } else {
        const progress: number = Number(((100 * taskDetails.totalLoggedTime) / taskDetails.estimatedTime).toFixed(2));

        // if process is grater 100 then over time is added
        // in this case calculate overtime and set remaining time to 0
        if (progress > 100) {
          taskDetails.progress = 100;
          taskDetails.remainingTime = 0;
          taskDetails.overLoggedTime = taskDetails.totalLoggedTime - taskDetails.estimatedTime;

          const overProgress = Number(((100 * taskDetails.overLoggedTime) / taskDetails.estimatedTime).toFixed(2));
          taskDetails.overProgress = overProgress > 100 ? 100 : overProgress;
        } else {
          // normal time logged
          // set overtime 0 and calculate remaining time
          taskDetails.progress = progress;
          taskDetails.remainingTime = taskDetails.estimatedTime - taskDetails.totalLoggedTime;
          taskDetails.overLoggedTime = 0;
          taskDetails.overProgress = 0;
        }
      }
      // endregion

      // update task total logged time and total estimated time
      await this._taskModel.updateOne({ _id: this.toObjectId(model.timeLog.taskId) }, taskDetails, session);

      // create entry in task history collection
      // prepare task history modal
      const history = new TaskHistory();
      history.action = TaskHistoryActionEnum.timeLogged;
      history.createdById = model.timeLog.createdById;
      history.taskId = model.timeLog.taskId;
      history.desc = 'Time Logged';

      // add task history
      await this._taskHistoryService.addHistory(history, session);

      await session.commitTransaction();
      session.endSession();
      return {
        taskId: model.timeLog.taskId,
        progress: taskDetails.progress,
        totalLoggedTime: taskDetails.totalLoggedTime,
        totalLoggedTimeReadable: secondsToString(taskDetails.totalLoggedTime),
        remainingTime: taskDetails.remainingTime,
        remainingTimeReadable: secondsToString(taskDetails.remainingTime),
        overLoggedTime: taskDetails.overLoggedTime,
        overLoggedTimeReadable: secondsToString(taskDetails.overLoggedTime),
        overProgress: taskDetails.overProgress
      };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * get all time logs
   * @param model
   */
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

  /**
   * get project details by id
   * @param id: project id
   */
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

  /**
   * get task details by id
   * @param id: taskId
   */
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
