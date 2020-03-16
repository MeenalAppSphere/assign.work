import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  AddTaskTimeModel,
  DbCollection,
  Sprint,
  SprintTaskTimeLogResponse,
  Task,
  TaskHistoryActionEnum,
  TaskTimeLog,
  TaskTimeLogHistoryModel,
  TaskTimeLogHistoryResponseModel,
  TaskTimeLogResponse
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from '../general.service';
import { BadRequest, generateUtcDate, secondsToString, stringToSeconds } from '../../helpers/helpers';
import { TaskHistoryService } from '../task-history.service';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';
import { TaskTimeLogUtilityService } from './task-time-log.utility.service';
import { ProjectService } from '../project/project.service';
import { TaskService } from '../task/task.service';
import { SprintService } from '../sprint/sprint.service';
import { ModuleRef } from '@nestjs/core';
import { SprintUtilityService } from '../sprint/sprint.utility.service';
import { TaskUtilityService } from '../task/task.utility.service';
import { SprintReportService } from '../sprint-report/sprint-report.service';
import { SprintReportMembersTaskLoggingModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';

@Injectable()
export class TaskTimeLogService extends BaseService<TaskTimeLog & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _sprintService: SprintService;
  private _sprintReportService: SprintReportService;
  private _taskHistoryService: TaskHistoryService;

  private _utilityService: TaskTimeLogUtilityService;
  private _sprintUtilityService: SprintUtilityService;
  private _taskUtilityService: TaskUtilityService;

  constructor(
    @InjectModel(DbCollection.taskTimeLog) protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>,
    private readonly _generalService: GeneralService, private _moduleRef: ModuleRef
  ) {
    super(_taskTimeLogModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._sprintService = this._moduleRef.get('SprintService');
    this._sprintReportService = this._moduleRef.get('SprintReportService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');

    this._utilityService = new TaskTimeLogUtilityService(this._taskTimeLogModel);
    this._sprintUtilityService = new SprintUtilityService();
    this._taskUtilityService = new TaskUtilityService();
  }

  /**
   * add time to log for task
   * @param model: model contains project id and timeLog model ( : TaskTimeLog )
   */
  async addTimeLog(model: AddTaskTimeModel): Promise<TaskTimeLogResponse | SprintTaskTimeLogResponse> {
    if (!model) {
      BadRequest('Project Not Found');
    }

    return this.withRetrySession(async (session: ClientSession) => {
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);
      const taskDetails = await this._taskService.getTaskDetails(model.timeLog.taskId, model.projectId);

      let taskTimeLogResponse: TaskTimeLogResponse = null;
      let sprintDetails: Sprint = null;
      let sprintTaskTimeLogResponse: SprintTaskTimeLogResponse = null;

      // region validations
      this._utilityService.addTimeLogValidations(model.timeLog, taskDetails);
      // endregion

      // convert logged time to seconds
      model.timeLog.loggedTime = stringToSeconds(model.timeLog.loggedTimeReadable);

      // assign created by id
      model.timeLog.createdById = this._generalService.userId;

      // region working capacity check
      await this._utilityService.workingCapacityCheck(projectDetails, model.timeLog);
      // endregion

      // if task in sprint get sprint details
      if (taskDetails.sprintId) {
        // get sprint details
        sprintDetails = await this._sprintService.getSprintDetails(taskDetails.sprintId, model.projectId);

        // assign sprint id to time log model
        model.timeLog.sprintId = taskDetails.sprintId;
      } else {
        delete model.timeLog['sprintId'];
      }

      // add task log to db
      await this._taskTimeLogModel.create([model.timeLog], session);

      // calculate task logs and update task
      taskTimeLogResponse = await this.calculateTaskLogs(taskDetails, model, session);

      // region update sprint calculations
      if (sprintDetails) {
        // calculate sprint calculations and update sprint
        sprintTaskTimeLogResponse = await this.calculateSprintLogs(sprintDetails, model, session);
      }
      // endregion

      // create entry in task history collection
      // prepare task history model
      const history = this._taskHistoryService.createHistoryObject(
        taskDetails.sprintId ? TaskHistoryActionEnum.timeLoggedInSprint : TaskHistoryActionEnum.timeLogged,
        model.timeLog.taskId, taskDetails, taskDetails.sprintId
      );
      // add task history
      await this._taskHistoryService.addHistory(history, session);

      // if task is in sprint return sprint calculations after time logged
      if (sprintTaskTimeLogResponse) {
        return sprintTaskTimeLogResponse;
      } else {
        // if task is not in sprint return task calculations after time logged
        return taskTimeLogResponse;
      }
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
  private async calculateTaskLogs(taskDetails: Task, model: AddTaskTimeModel, session: ClientSession): Promise<TaskTimeLogResponse> {
    // region task logged time calculation
    taskDetails.totalLoggedTime = (taskDetails.totalLoggedTime || 0) + model.timeLog.loggedTime || 0;

    if (!taskDetails.estimatedTime) {
      // if not estimate time means one haven't added any estimate so progress will be 100 %
      taskDetails.progress = 100;
      model.timeLog.remainingTime = 0;
    } else {
      // calculate task progress
      this._taskUtilityService.calculateTaskProgress(taskDetails, taskDetails.totalLoggedTime, taskDetails.estimatedTime);
    }
    // endregion

    // update task total logged time and total estimated time
    await this._taskService.updateById(model.timeLog.taskId, taskDetails, session);

    return {
      taskId: model.timeLog.taskId,
      sprintId: null,
      progress: taskDetails.progress,
      totalLoggedTime: taskDetails.totalLoggedTime,
      totalLoggedTimeReadable: secondsToString(taskDetails.totalLoggedTime),
      remainingTime: taskDetails.remainingTime,
      remainingTimeReadable: secondsToString(taskDetails.remainingTime),
      overLoggedTime: taskDetails.overLoggedTime,
      overLoggedTimeReadable: secondsToString(taskDetails.overLoggedTime),
      overProgress: taskDetails.overProgress
    };
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
  private async calculateSprintLogs(sprintDetails: Sprint, model: AddTaskTimeModel, session: ClientSession): Promise<SprintTaskTimeLogResponse> {

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
      const sprintColumnTask = sprintDetails.columns[sprintColumnIndex].tasks[columnTaskIndex];
      sprintColumnTask.totalLoggedTime += model.timeLog.loggedTime || 0;

      // add logged time to sprint total logged time
      sprintDetails.totalLoggedTime += model.timeLog.loggedTime || 0;

      // calculate progress
      sprintDetails.progress = Number(((100 * sprintDetails.totalLoggedTime) / sprintDetails.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES));

      if (sprintDetails.progress > 100) {
        // if progress > 100 means over logging happened
        sprintDetails.totalRemainingTime = 0;

        // calculate over logged time by deducting total estimation from total logged time
        sprintDetails.totalOverLoggedTime = sprintDetails.totalLoggedTime - sprintDetails.totalEstimation;
      } else {
        // if progress is lesser or equal to 100 means no over logging done
        sprintDetails.totalRemainingTime = sprintDetails.totalRemainingTime - sprintDetails.totalLoggedTime;
        sprintDetails.totalOverLoggedTime = 0;
      }

      // calculate over progress
      sprintDetails.overProgress = Number(((100 * sprintDetails.totalOverLoggedTime) / sprintDetails.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;

      /**
       * update sprint by id and set totalLoggedTime, totalRemainingTime and totalOverLoggedTime
       * and also update task's totalLoggedTime in sprint column
       */
      await this._sprintService.updateById(sprintDetails.id, {
        totalLoggedTime: sprintDetails.totalLoggedTime,
        totalRemainingTime: sprintDetails.totalRemainingTime,
        totalOverLoggedTime: sprintDetails.totalOverLoggedTime,
        [`columns.${sprintColumnIndex}.tasks.${columnTaskIndex}.totalLoggedTime`]: sprintColumnTask.totalLoggedTime
      }, session);

      // get sprint report details
      const sprintReport = await this._sprintReportService.getSprintReportDetails(sprintDetails.reportId);

      // find task in sprint report
      const sprintReportTaskIndex = sprintReport.reportTasks.findIndex(task => {
        return task.taskId.toString() === model.timeLog.taskId;
      });

      // update task logged time
      sprintReport.reportTasks[sprintReportTaskIndex].totalLoggedTime = sprintColumnTask.totalLoggedTime;

      // get member index from report member
      const sprintReportMemberIndex = sprintReport.reportMembers.findIndex(member => {
        return member.userId.toString() === model.timeLog.createdById;
      });

      // if user is not part of sprint don't allow him to log time
      if (sprintReportMemberIndex === -1) {
        BadRequest('User is not part of sprint, so you can\'t log time');
      }

      // update member time logged
      sprintReport.reportMembers[sprintReportMemberIndex].totalLoggedTime += model.timeLog.loggedTime || 0;

      // add new task wise time log in member time wise log
      const taskWiseLog: SprintReportMembersTaskLoggingModel = {
        taskId: model.timeLog.taskId, loggedTime: model.timeLog.loggedTime, loggedAt: generateUtcDate()
      };
      sprintReport.reportMembers[sprintReportMemberIndex].taskWiseTimeLog.push(taskWiseLog);

      // report update doc
      const updateReportDoc = {
        $set: {
          [`reportTasks.${sprintReportTaskIndex}.totalLoggedTime`]: sprintColumnTask.totalLoggedTime,
          [`reportMembers.${sprintReportMemberIndex}.totalLoggedTime`]: sprintReport.reportMembers[sprintReportMemberIndex].totalLoggedTime
        },
        $push: {
          [`reportMembers.${sprintReportMemberIndex}.taskWiseTimeLog`]: taskWiseLog
        }
      };

      // update report by id
      await this._sprintReportService.updateById(sprintReport.id, updateReportDoc, session);


      // return sprint calculations
      return {
        taskId: sprintColumnTask.taskId,
        sprintId: sprintDetails.id,
        progress: sprintDetails.progress,
        totalLoggedTime: sprintDetails.totalLoggedTime,
        totalLoggedTimeReadable: secondsToString(sprintDetails.totalLoggedTime),
        remainingTime: sprintDetails.totalRemainingTime,
        remainingTimeReadable: secondsToString(sprintDetails.totalRemainingTime),
        overLoggedTime: sprintDetails.totalOverLoggedTime,
        overLoggedTimeReadable: secondsToString(sprintDetails.totalOverLoggedTime),
        overProgress: sprintDetails.overProgress,
        taskTotalLoggedTime: sprintColumnTask.totalLoggedTime,
        taskTotalLoggedTimeReadable: secondsToString(sprintColumnTask.totalLoggedTime)
      };
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
