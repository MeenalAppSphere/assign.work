import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  AddTaskTimeModel,
  DbCollection,
  Sprint,
  SprintColumnTask,
  SprintStatusEnum,
  Task,
  TaskHistory,
  TaskHistoryActionEnum,
  TaskTimeLog,
  TaskTimeLogHistoryModel,
  TaskTimeLogHistoryResponseModel,
  TaskTimeLogResponse
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from '../general.service';
import { BadRequest, secondsToString, stringToSeconds } from '../../helpers/helpers';
import { TaskHistoryService } from '../task-history.service';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';
import { TaskTimeLogUtilityService } from './task-time-log.utility.service';
import { ProjectService } from '../project/project.service';
import { TaskService } from '../task/task.service';
import { SprintService } from '../sprint/sprint.service';
import { ModuleRef } from '@nestjs/core';
import { SprintUtilityService } from '../sprint/sprint.utility.service';

@Injectable()
export class TaskTimeLogService extends BaseService<TaskTimeLog & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _sprintService: SprintService;

  private _utilityService: TaskTimeLogUtilityService;
  private _sprintUtilityService: SprintUtilityService;

  constructor(
    @InjectModel(DbCollection.taskTimeLog) protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>,
    private _taskHistoryService: TaskHistoryService, private readonly _generalService: GeneralService,
    private _moduleRef: ModuleRef
  ) {
    super(_taskTimeLogModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._sprintService = this._moduleRef.get('SprintService');

    this._utilityService = new TaskTimeLogUtilityService(this._taskTimeLogModel);
    this._sprintUtilityService = new SprintUtilityService();
  }

  /**
   * add time to log for task
   * @param model: model contains project id and timeLog model ( : TaskTimeLog )
   */
  async addTimeLog(model: AddTaskTimeModel): Promise<TaskTimeLogResponse> {
    return this.withRetrySession(async (session: ClientSession) => {
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);
      const taskDetails = await this._taskService.getTaskDetails(model.timeLog.taskId, model.projectId);

      let sprintDetails: Sprint = null;

      // region validations
      this._utilityService.addTimeLogValidations(model.timeLog, taskDetails);
      // endregion

      // convert logged time to seconds
      model.timeLog.loggedTime = stringToSeconds(model.timeLog.loggedTimeReadable);

      // region working capacity check
      await this._utilityService.workingCapacityCheck(projectDetails, model.timeLog);
      // endregion

      // if task in sprint get sprint details
      if (taskDetails.sprintId) {
        sprintDetails = await this._sprintService.findOne({
          filter: {
            _id: taskDetails.sprintId,
            projectId: model.projectId,
            isDeleted: false,
            'sprintStatus.status': SprintStatusEnum.inProgress
          }, lean: true, select: 'totalLoggedTime totalEstimation totalOverLoggedTime columns'
        });

        // assign sprint id to time log model
        model.timeLog.sprintId = taskDetails.sprintId;
      } else {
        delete model.timeLog['sprintId'];
      }

      // add task log to db
      await this._taskTimeLogModel.create([model.timeLog], session);

      // calculate task logs and update task
      await this.calculateTaskLogs(taskDetails, model, session);

      // region update sprint calculations
      if (sprintDetails) {
        // calculate sprint calculations and update sprint
        const sprintTask = await this.calculateSprintLogs(sprintDetails, model, session);

        /**
         * replace task's logged time with sprint task's logged time
         * because this task can be part of multiple sprint and one have logged time for this task in various sprint
         * so we have replace it's total logged time with this sprint's task logged time
         */
        taskDetails.totalLoggedTime = sprintTask.totalLoggedTime;
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
    });
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
    await this._taskService.updateById(model.timeLog.taskId, taskDetails, session);
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
  private async calculateSprintLogs(sprintDetails: Sprint, model: AddTaskTimeModel, session: ClientSession): Promise<SprintColumnTask> {

    if (sprintDetails) {
      sprintDetails.id = sprintDetails._id.toString();

      // get column index by task id from sprint columns
      const sprintColumnIndex = this._sprintUtilityService.getColumnIndexFromTask(sprintDetails, model.timeLog.taskId);
      if (sprintColumnIndex === -1) {
        BadRequest('Sprint Column not found');
      }

      // get column task index from sprint column
      const columnTaskIndex = this._sprintUtilityService.getTaskIndexFromColumn(sprintDetails, sprintColumnIndex, model.timeLog.taskId);
      if (columnTaskIndex === -1) {
        BadRequest('Task not found in sprint');
      }

      // add logged time for this task to sprint task object for sprint report
      sprintDetails.columns[sprintColumnIndex].tasks[columnTaskIndex].totalLoggedTime += model.timeLog.loggedTime || 0;

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

      /**
       * update sprint by id and set totalLoggedTime, totalRemainingTime and totalOverLoggedTime
       * and also update task's totalLoggedTime in sprint column
       */
      await this._sprintService.updateById(sprintDetails.id, {
        totalLoggedTime: sprintDetails.totalLoggedTime,
        totalRemainingTime: sprintDetails.totalRemainingTime,
        totalOverLoggedTime: sprintDetails.totalOverLoggedTime,
        [`columns.${sprintColumnIndex}.tasks.${columnTaskIndex}.totalLoggedTime`]:
        sprintDetails.columns[sprintColumnIndex].tasks[columnTaskIndex].totalLoggedTime
      }, session);

      return sprintDetails.columns[sprintColumnIndex].tasks[columnTaskIndex];
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
    await this._projectService.getProjectDetails(model.projectId);

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
}
