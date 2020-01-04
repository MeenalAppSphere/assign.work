import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddTaskTimeModel,
  DbCollection,
  Project,
  Sprint,
  SprintStatusEnum,
  Task,
  TaskHistory,
  TaskHistoryActionEnum,
  TaskTimeLog,
  TaskTimeLogHistoryModel,
  TaskTimeLogHistoryResponseModel,
  TaskTimeLogResponse,
  User
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';
import { secondsToString, stringToSeconds } from '../helpers/helpers';
import { TaskHistoryService } from './task-history.service';
import { DEFAULT_DECIMAL_PLACES } from '../helpers/defaultValueConstant';

@Injectable()
export class TaskTimeLogService extends BaseService<TaskTimeLog & Document> {
  constructor(
    @InjectModel(DbCollection.taskTimeLog) protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>,
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    private _taskHistoryService: TaskHistoryService, private readonly _generalService: GeneralService
  ) {
    super(_taskTimeLogModel);
  }

  /**
   * add time to log for task
   * @param model: model contains project id and timeLog model ( : TaskTimeLog )
   */
  async addTimeLog(model: AddTaskTimeModel): Promise<TaskTimeLogResponse> {

    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.timeLog.taskId);
    let sprintDetails: Sprint = null;

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

    // Started date validation is after today means someone have logged for future
    const isStartedDateInFuture = moment(model.timeLog.startedAt).isAfter(moment().endOf('d'));
    if (isStartedDateInFuture) {
      throw new BadRequestException('You can\'t log time for future date!');
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
        // check if user logged more than allowed for day
        if ((totalLoggedTime + model.timeLog.loggedTime) > (userDetails.workingCapacityPerDay * 3600)) {
          throw new BadRequestException('your logging limit exceeded for Given date!');
        }
      } else {
        // logged for a period of a time

        // count for how many days one is logging
        // if count is 0 then one is logging is for the same date then mark it as 1
        const countTotalDay = endDate.diff(startedDate, 'd') || 1;

        // logged only for a multiple days ( periodically )
        if ((totalLoggedTime + model.timeLog.loggedTime) > ((userDetails.workingCapacityPerDay * countTotalDay) * 3600)) {
          throw new BadRequestException('your logging limit exceeded for Given dates!');
        }
      }
    }
    // endregion

    // if task in sprint get sprint details
    if (taskDetails.sprintId) {
      sprintDetails = await this._sprintModel.findOne({
        _id: taskDetails.sprintId,
        projectId: model.projectId,
        isDeleted: false,
        'sprintStatus.status': SprintStatusEnum.inProgress
      }).select('totalLoggedTime totalEstimation totalOverLoggedTime ').lean();

      // assign sprint id to timelog model
      model.timeLog.sprintId = taskDetails.sprintId;
    } else {
      delete model.timeLog['sprintId'];
    }

    const session = await this._taskTimeLogModel.db.startSession();
    session.startTransaction();

    try {
      // add task log to db
      await this._taskTimeLogModel.create([model.timeLog], session);

      // calculate task logs and update task
      await this.calculateTaskLogs(taskDetails, model, session);

      // region update sprint calculations
      // ensure task is in sprint
      if (sprintDetails) {
        // calculate sprint calculations and update sprint
        await this.calculateSprintLogs(sprintDetails, model, session);
      }
      // endregion

      // create entry in task history collection
      // prepare task history modal
      const history = new TaskHistory();
      history.sprintId = taskDetails.sprintId;
      history.action = history.sprintId ? TaskHistoryActionEnum.timeLoggedInSprint : TaskHistoryActionEnum.timeLogged;
      history.createdById = model.timeLog.createdById;
      history.taskId = model.timeLog.taskId;
      history.task = taskDetails;
      history.desc = history.sprintId ? 'Time Logged for a sprint' : 'Time Logged';

      // add task history
      await this._taskHistoryService.addHistory(history, session);

      await session.commitTransaction();
      session.endSession();
      return {
        taskId: model.timeLog.taskId,
        sprintId: model.timeLog.sprintId,
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
   * calculate Task Logs
   * calculate task logs and update task in db
   * first add logged time to task, then calculate progress
   * if progress grater than 100 means over logging done
   * calculate progress and over progress
   * finally update task
   * @param taskDetails
   * @param model
   * @param session
   */
  private async calculateTaskLogs(taskDetails: Task, model: AddTaskTimeModel, session: ClientSession) {
    // region task logged time calculation
    taskDetails.totalLoggedTime = (taskDetails.totalLoggedTime || 0) + model.timeLog.loggedTime || 0;

    if (!taskDetails.estimatedTime) {
      // if not estimate time means one haven't added any estimate so progress will be 100 %
      taskDetails.progress = 100;
      model.timeLog.remainingTime = 0;
    } else {
      const progress: number = Number(((100 * taskDetails.totalLoggedTime) / taskDetails.estimatedTime).toFixed(DEFAULT_DECIMAL_PLACES));

      // if process is grater 100 then over time is added
      // in this case calculate overtime and set remaining time to 0
      if (progress > 100) {
        taskDetails.progress = 100;
        taskDetails.remainingTime = 0;
        taskDetails.overLoggedTime = taskDetails.totalLoggedTime - taskDetails.estimatedTime;

        const overProgress = Number(((100 * taskDetails.overLoggedTime) / taskDetails.estimatedTime).toFixed(DEFAULT_DECIMAL_PLACES));
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
    await this._taskModel.updateOne({ _id: model.timeLog.taskId }, taskDetails, { session });
  }

  /**
   * calculate sprint logs
   * add logged time to sprint total logged time
   * calculate progress, if progress grater than 100, means over logging done
   * calculate over logging progress
   * finally update sprint
   * @param sprintDetails: Sprint
   * @param model
   * @param session
   */
  private async calculateSprintLogs(sprintDetails: Sprint, model: AddTaskTimeModel, session: ClientSession) {

    if (sprintDetails) {
      sprintDetails.id = sprintDetails['_id'];
      // add logged time to sprint total logged time
      sprintDetails.totalLoggedTime += model.timeLog.loggedTime || 0;

      // calculate progress
      const progress: number = Number(((100 * sprintDetails.totalLoggedTime) / sprintDetails.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES));

      if (progress > 100) {
        // if progress > 100 means over logging happened
        sprintDetails.totalRemainingTime = 0;

        // calculate over logged time by deducting total estimation from total logged time
        sprintDetails.totalOverLoggedTime = sprintDetails.totalLoggedTime - sprintDetails.totalEstimation;
      } else {
        // if progress is lesser or equal to 100 means no over logging done
        sprintDetails.totalRemainingTime = sprintDetails.totalRemainingTime - sprintDetails.totalLoggedTime;
        sprintDetails.totalOverLoggedTime = 0;
      }

      return this._sprintModel.updateOne({ _id: sprintDetails.id }, {
        totalLoggedTime: sprintDetails.totalLoggedTime, totalRemainingTime: sprintDetails.totalRemainingTime,
        totalOverLoggedTime: sprintDetails.totalOverLoggedTime
      }, { session });
    }
  }

  /**
   * get all time logs
   * @param model
   */
  async getAllLogs(model: TaskTimeLogHistoryModel) {
    if (!model.taskId) {
      throw new BadRequestException('Task not found');
    }
    const projectDetails = await this.getProjectDetails(model.projectId);

    try {
      const timeLogHistory: TaskTimeLogHistoryResponseModel[] = await this._taskTimeLogModel.aggregate([{
        $match: { 'taskId': this.toObjectId(model.taskId) }
      }, {
        $group: {
          _id: '$createdById',
          totalLoggedTime: { $sum: '$loggedTime' }
        }
      }, {
        $lookup: {
          from: DbCollection.users,
          localField: '_id',
          foreignField: '_id',
          as: 'loggedBy'
        }
      }, { $unwind: '$loggedBy' }, {
        $project: {
          _id: 0,
          user: { $concat: ['$loggedBy.firstName', ' ', '$loggedBy.lastName'] },
          emailId: '$loggedBy.emailId',
          profilePic: '$loggedBy.profilePic',
          totalLoggedTime: '$totalLoggedTime'
        }
      }]).exec();

      if (timeLogHistory) {
        timeLogHistory.forEach(timeLog => {
          timeLog.totalLoggedTimeReadable = secondsToString(timeLog.totalLoggedTime);
        });
      }

      return timeLogHistory;
    } catch (e) {
      throw e;
    }
  }

  /**
   * get project details by id
   * @param id: project id
   */
  private async getProjectDetails(id: string): Promise<Project> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Project Not Found');
    }

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
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Task Not Found');
    }

    const taskDetails: Task = await this._taskModel.findOne({
      _id: this.toObjectId(id),
      isDeleted: false
    }).select('totalLoggedTime estimatedTime progress remainingTime overLoggedTime createdAt sprintId').lean().exec();

    if (!taskDetails) {
      throw new NotFoundException('No Task Found');
    }
    return taskDetails;
  }
}
