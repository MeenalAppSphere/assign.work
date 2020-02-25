import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  SprintDurationsModel,
  AddTaskToSprintModel,
  BasePaginatedResponse,
  BoardModel,
  CloseSprintModel,
  CreateSprintModel,
  DbCollection,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel,
  MoveTaskToColumnModel,
  Project,
  PublishSprintModel,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintActionEnum,
  SprintColumn,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintStatus,
  SprintStatusEnum,
  Task,
  TaskHistory,
  TaskHistoryActionEnum,
  UpdateSprintMemberWorkingCapacity,
  UpdateSprintModel,
  SprintErrorResponseItem, CreateSprintCloseSprintCommonModel
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from '../general.service';
import * as moment from 'moment';
import {
  BadRequest,
  generateUtcDate,
  hourToSeconds,
  secondsToString,
  validWorkingDaysChecker
} from '../../helpers/helpers';
import { TaskService } from '../task/task.service';
import { ModuleRef } from '@nestjs/core';
import { SprintUtilityService } from './sprint.utility.service';
import { TaskHistoryService } from '../task-history.service';
import { ProjectService } from '../project/project.service';
import { BoardUtilityService } from '../board/board.utility.service';
import { EmailService } from '../email.service';

const commonPopulationForSprint = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'updatedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'membersCapacity.user',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}];

const detailedPopulationForSprint = [...commonPopulationForSprint, {
  path: 'columns.tasks.addedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'columns.tasks.task',
  select: 'name displayName sprintId priorityId taskTypeId statusId assigneeId estimatedTime remainingTime overLoggedTime totalLoggedTime',
  justOne: true,
  populate: [{
    path: 'assignee',
    select: 'emailId userName firstName lastName profilePic -_id',
    justOne: true
  }, {
    path: 'taskType',
    select: 'name color',
    justOne: true
  }, {
    path: 'status',
    select: 'name',
    justOne: true
  }, {
    path: 'priority',
    select: 'name color',
    justOne: true
  }]
}];

const commonFieldSelection = 'name startedAt endAt goal sprintStatus membersCapacity totalCapacity totalEstimation totalLoggedTime totalOverLoggedTime createdById updatedById removedById removedAt';
const detailedFiledSelection = `${commonFieldSelection} columns`;

@Injectable()
export class SprintService extends BaseService<Sprint & Document> implements OnModuleInit {

  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _taskHistoryService: TaskHistoryService;

  private _sprintUtilityService: SprintUtilityService;
  private _boardUtilityService: BoardUtilityService;

  constructor(
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    private _generalService: GeneralService, private _moduleRef: ModuleRef, private _emailService: EmailService
  ) {
    super(_sprintModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');

    this._boardUtilityService = new BoardUtilityService();
    this._sprintUtilityService = new SprintUtilityService();
  }

  /**
   * get all sprints
   * with pagination
   * @param model
   */
  public async getAllSprints(model: GetAllSprintRequestModel) {
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);

    // set populate fields
    model.populate = [{
      path: 'createdBy',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }];

    // set selection fields
    model.select = '_id name startedAt endAt goal projectId sprintStatus createdById';

    const filter = {
      projectId: this.toObjectId(model.projectId)
    };
    const result: BasePaginatedResponse<Sprint> = await this.getAllPaginatedData(filter, model);

    // loop over sprints array and prepare vm object for all sprints
    result.items.forEach(sprint => {
      sprint = this._sprintUtilityService.prepareSprintVm(sprint);
    });
    return result;
  }

  /**
   * get sprint by sprint id
   * model: GetSprintByIdRequestModel
   */
  public async getSprintById(model: GetSprintByIdRequestModel, onlyPublished: boolean = false) {

    // const query = [
    //   {
    //     $match: {
    //       _id: this.toObjectId(model.sprintId),
    //       projectId: this.toObjectId(model.projectId),
    //       isDeleted: false
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: DbCollection.users,
    //       localField: 'createdById',
    //       foreignField: '_id',
    //       as: 'createdBy'
    //     }
    //   }, { $unwind: '$createdBy' },
    //   {
    //     $lookup: {
    //       from: DbCollection.users,
    //       localField: 'membersCapacity.userId',
    //       foreignField: '_id',
    //       as: 'membersCapacityUser'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: DbCollection.tasks,
    //       localField: 'columns.tasks.taskId',
    //       foreignField: '_id',
    //       as: 'columns.tasks.task',
    //     }
    //   },
    // ];
    //
    // return this.dbModel.aggregate(query).exec();

    const projectDetails = await this._projectService.getProjectDetails(model.projectId);

    const filter = {
      _id: model.sprintId,
      projectId: model.projectId,
      isDeleted: false
    };

    if (onlyPublished) {
      filter['sprintStatus.status'] = SprintStatusEnum.inProgress;
    }

    const sprint = await this._sprintModel.findOne(filter).populate(detailedPopulationForSprint).select(detailedFiledSelection).lean().exec();
    return this._sprintUtilityService.prepareSprintVm(sprint);
  }

  /**
   * get only published sprint
   * @param model
   */
  public async getPublishedSprintById(model: GetSprintByIdRequestModel) {
    return this.getSprintById(model, true);
  }

  /**
   * create sprint
   * @param model: CreateSprintModel
   */
  public async createSprint(model: CreateSprintModel) {
    // create sprint
    const newSprint = await this.withRetrySession(async (session: ClientSession) => {
      // get project details and check if current user is member of project
      const projectDetails = await this._projectService.getProjectDetails(model.sprint.projectId, true);

      // create sprint common process
      const createdSprint = await this.createSprintCommonProcess(model, projectDetails, session);

      // return created sprint
      return createdSprint[0];
    });

    // get sprint details and return response
    const sprint = await this.getSprintDetails(newSprint.id, model.sprint.projectId, commonPopulationForSprint, commonFieldSelection);
    return this._sprintUtilityService.prepareSprintVm(sprint);
  }

  /**
   * update sprint
   * @param model: UpdateSprintModel
   */
  public async updateSprint(model: UpdateSprintModel) {
    // basic validation
    if (!model.sprint) {
      throw new BadRequestException('invalid request sprint details missing');
    }

    if (!model.sprint.id) {
      throw new BadRequestException('Sprint not found');
    }

    // perform common validations
    this._sprintUtilityService.commonSprintValidator(model.sprint);

    // get project details
    const projectDetails = await this._projectService.getProjectDetails(model.sprint.projectId);

    // sprint unique name validation per project
    const isSprintNameAlreadyExits = await this._sprintModel.find({
      name: { $regex: new RegExp(`^${model.sprint.name}$`), $options: 'i' },
      _id: { $ne: model.sprint.id },
      isDeleted: false,
      projectId: model.sprint.projectId

    }).select('name').countDocuments();

    if (isSprintNameAlreadyExits > 0) {
      throw new BadRequestException('Sprint name already exits');
    }

    const sprintDetails: Sprint = await this._sprintModel
      .findOne({ _id: model.sprint.id, isDeleted: false })
      .select('name startedAt endAt goal sprintStatus')
      .lean()
      .exec();

    if (!sprintDetails) {
      throw new BadRequestException('Sprint not found!');
    }

    if (sprintDetails.sprintStatus) {
      let msgStatus = '';
      // switch over sprint status
      switch (sprintDetails.sprintStatus.status) {
        case SprintStatusEnum.inProgress:
          msgStatus = 'Published';
          break;
        case SprintStatusEnum.closed:
          msgStatus = 'Closed';
          break;
        case SprintStatusEnum.completed:
          msgStatus = 'Completed';
      }

      throw new BadRequestException(`Sprint is already ${msgStatus}! You can not update it`);
    }

    const session = await this.startSession();

    try {
      await this._sprintModel.updateOne({ _id: model.sprint.id }, {
        $set: {
          name: model.sprint.name, goal: model.sprint.goal, startedAt: model.sprint.startedAt, endAt: model.sprint.endAt
        }
      }, { session });
      await this.commitTransaction(session);

      const sprint = await this.getSprintDetails(model.sprint.id, model.sprint.projectId, commonPopulationForSprint, commonFieldSelection);
      return this._sprintUtilityService.prepareSprintVm(sprint);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * add task to sprint
   * check validations
   * check if sprint allows to adjust hours then directly add task
   * but if not then check for some capacity related validation before adding task to sprint
   * @param model
   */
  public async addTaskToSprint(model: AddTaskToSprintModel): Promise<SprintDurationsModel | SprintErrorResponse> {
    return await this.withRetrySession(async (session: ClientSession) => {
      const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);

      // sprint details
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId, detailedPopulationForSprint, detailedFiledSelection);

      // check sprint status validations
      if (sprintDetails.sprintStatus) {
        switch (sprintDetails.sprintStatus.status) {
          case SprintStatusEnum.inProgress:
            if (moment(sprintDetails.endAt).isBefore(moment(), 'd')) {
              BadRequest('Sprint end date is passed, so you can\'t add new task to it');
            }
            break;
          case SprintStatusEnum.completed:
            BadRequest('this sprint is completed you can\'t add task to sprint');
            break;
          case SprintStatusEnum.closed:
            BadRequest('this sprint is closed you can\'t add task to sprint');
            break;
        }
      }

      // task details
      const taskDetails = await this._taskService.getTaskDetails(model.taskId, model.projectId);

      // check if task is already added in sprint or not
      const taskIsAlreadyInSprint = sprintDetails.columns.some(column => {
        return column.tasks.filter(task => !task.removedById).some(task => task.taskId === taskDetails.id);
      });

      // create sprint error response object
      const sprintErrorResponse = new SprintErrorResponse();
      sprintErrorResponse.tasksError = new SprintErrorResponseItem();
      sprintErrorResponse.membersError = new SprintErrorResponseItem();

      // set task error id and name
      sprintErrorResponse.tasksError.id = taskDetails.id;
      sprintErrorResponse.tasksError.name = taskDetails.displayName;

      // set member error id and name
      sprintErrorResponse.membersError.id = taskDetails.id;
      sprintErrorResponse.membersError.name = taskDetails.displayName;

      if (taskIsAlreadyInSprint) {
        // return task is already in sprint error
        sprintErrorResponse.tasksError.reason = SprintErrorEnum.alreadyInSprint;
        return sprintErrorResponse;
      }

      taskDetails.id = model.taskId;

      // check if task is allowed to added to sprint
      this._sprintUtilityService.checkTaskIsAllowedToAddInSprint(taskDetails);

      // if adjustHoursAllowed not allowed than apply strict check for sprint timings
      if (!model.adjustHoursAllowed) {

        // check if sprint have over logged time
        if (sprintDetails.totalOverLoggedTime) {
          // return error sprint capacity exceed
          sprintErrorResponse.tasksError.reason = SprintErrorEnum.sprintCapacityExceed;
          return sprintErrorResponse;
        } else {
          let allTaskTotalEstimation = 0;
          let currentTaskAssigneeTotalEstimation = 0;

          // get task assignee details from sprint members
          const currentAssigneeDetails = sprintDetails.membersCapacity.find(member => member.userId.toString() === taskDetails.assigneeId.toString());

          // get all tasks from the sprint and push it to all tasks array
          sprintDetails.columns.forEach(column => {
            column.tasks.forEach(task => {
              allTaskTotalEstimation += task.task.estimatedTime;

              if (task.task.assigneeId.toString() === taskDetails.assigneeId.toString()) {
                currentTaskAssigneeTotalEstimation += task.task.estimatedTime;
              }
            });
          });

          // check if sprint total capacity exceed after adding requested task estimated time
          if (allTaskTotalEstimation + taskDetails.estimatedTime > sprintDetails.totalCapacity) {
            // return error sprint capacity exceed
            sprintErrorResponse.tasksError.reason = SprintErrorEnum.sprintCapacityExceed;
            return sprintErrorResponse;
          } else if (currentTaskAssigneeTotalEstimation + taskDetails.estimatedTime > currentAssigneeDetails.workingCapacity) {

            // check if task assignee capacity exceed after adding requested task estimated time
            // return error sprint capacity exceed
            sprintErrorResponse.tasksError.reason = SprintErrorEnum.memberCapacityExceed;
            return sprintErrorResponse;
          } else {
            // start task add process
            return await this.processAddTaskToSprint(projectDetails, sprintDetails, taskDetails, session);
          }
        }
      } else {
        // start task add process
        return await this.processAddTaskToSprint(projectDetails, sprintDetails, taskDetails, session);
      }
    });
  }

  /**
   * remove task from sprint
   * get all tasks details, then minus theirs estimation from sprint total estimation
   * filter it out from stage [0]
   * update task and remove sprint Id from that task
   * update sprint and return removed task id Array
   * @param model: RemoveTaskFromSprintModel
   * @return {Promise<void>}
   */
  public async removeTaskFromSprint(model: RemoveTaskFromSprintModel) {
    return await this.withRetrySession(async (session: ClientSession) => {
      await this._projectService.getProjectDetails(model.projectId);

      // get sprint details
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId, [], detailedFiledSelection);

      // check if requested task is in sprint
      const taskIsInSprint = sprintDetails.columns.some(column => {
        return column.tasks.some(task => task.taskId.toString() === model.taskId);
      });

      if (!taskIsInSprint) {
        BadRequest('Task is not added to sprint, so you can\'t remove it');
      }

      // get task details by id
      const taskDetails = await this._taskService.getTaskDetails(model.taskId, model.projectId);

      // get column index from sprint columns
      const columnIndex = this._sprintUtilityService.getColumnIndexFromTask(sprintDetails, model.taskId);
      // get task index from column
      const taskIndex = sprintDetails.columns[columnIndex].tasks.findIndex(task => task.taskId.toString() === model.taskId);

      // mark task as removed and add removed by id
      sprintDetails.columns[columnIndex].tasks[taskIndex].removedById = this._generalService.userId;
      sprintDetails.columns[columnIndex].tasks[taskIndex].removedAt = generateUtcDate();

      // minus task estimate from column's total estimate
      sprintDetails.columns[columnIndex].totalEstimation -= taskDetails.estimatedTime;

      // minus task estimate from sprint total estimations
      sprintDetails.totalEstimation -= taskDetails.estimatedTime;

      // update sprint by id
      await this.updateById(model.sprintId, {
        $set: {
          [`columns.${columnIndex}`]: sprintDetails.columns[columnIndex],
          totalEstimation: sprintDetails.totalEstimation
        }
      }, session);

      // create task history
      const taskHistory = new TaskHistory();
      taskHistory.taskId = taskDetails.id;
      taskHistory.task = taskDetails;
      taskHistory.sprintId = sprintDetails.id;
      taskHistory.createdAt = generateUtcDate();
      taskHistory.createdById = this._generalService.userId;
      taskHistory.action = TaskHistoryActionEnum.removedFromSprint;
      taskHistory.desc = TaskHistoryActionEnum.removedFromSprint;

      // create task history
      await this._taskHistoryService.addHistory(taskHistory, session);

      // update task and remove sprint id
      await this._taskService.updateById(taskDetails.id, {
        $set: { sprintId: null }
      }, session);

      return {
        totalCapacity: sprintDetails.totalCapacity,
        totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
        totalEstimation: sprintDetails.totalEstimation,
        totalEstimationReadable: secondsToString(sprintDetails.totalEstimation),
        totalRemainingCapacity: sprintDetails.totalCapacity - sprintDetails.totalEstimation,
        totalRemainingCapacityReadable: secondsToString(sprintDetails.totalCapacity - sprintDetails.totalEstimation)
      };

    });
  }

  /**
   * assign tasks to a sprint
   * @param model: AssignTasksToSprintModel
   */
  // public async assignTasksToSprint(model: AssignTasksToSprintModel): Promise<AddTaskRemoveTaskToSprintResponseModel | SprintErrorResponse> {
  //   return await this.withRetrySession(async (session: ClientSession) => {
  //     const project = await this._projectService.getProjectDetails(model.projectId, true);
  //
  //     // get sprint details from sprint id
  //     const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId, [], '');
  //
  //     // gather all task from all columns to this variable
  //     const allColumnsTasksIds: Array<string | Types.ObjectId> = [];
  //     sprintDetails.columns.forEach(column => {
  //       allColumnsTasksIds.push(...column.tasks.map(task => task.taskId.toString()));
  //     });
  //
  //     // get all task that need to be added to sprint
  //     let newTasks: Array<string | Types.ObjectId> = model.tasks.filter(task => {
  //       return !allColumnsTasksIds.includes(task);
  //     });
  //
  //     // get all removed task from sprint
  //     let removedTasks: Array<string | Types.ObjectId> = allColumnsTasksIds.filter(task => {
  //       return !model.tasks.includes(task as string);
  //     });
  //
  //     if (!newTasks.length && !removedTasks.length) {
  //       throw new BadRequestException('Oops It\'s seems that your sprint is empty, please assign a new item to save a sprint');
  //     }
  //
  //     // region remove task from sprint
  //     // check if any task is removed or not and also check if sprint is not published then and only then one can remove tasks from the sprint
  //     if (removedTasks.length && sprintDetails.sprintStatus.status !== SprintStatusEnum.inProgress) {
  //       removedTasks = removedTasks.map(task => this.toObjectId(task as string));
  //       const removedTasksDetails = await this._taskService.dbModel.aggregate([
  //         {
  //           $match: {
  //             projectId: this.toObjectId(model.projectId),
  //             _id: { $in: removedTasks },
  //             isDeleted: false,
  //             sprintId: this.toObjectId(model.sprintId)
  //           }
  //         }
  //       ]);
  //
  //       if (removedTasksDetails.length !== removedTasks.length) {
  //         throw new BadRequestException('one of tasks not found');
  //       }
  //
  //       // loop over all the tasks and minus estimation time from sprint total estimation
  //       // update task in db set sprintId to null
  //       for (let i = 0; i < removedTasksDetails.length; i++) {
  //         const task = removedTasksDetails[i];
  //         const columnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, task.statusId);
  //         task.id = task['_id'];
  //
  //         // minus task estimation from column  totalEstimation
  //         sprintDetails.columns[columnIndex].totalEstimation -= task.estimatedTime;
  //
  //         // remove task from column
  //         sprintDetails.columns[columnIndex].tasks = sprintDetails.columns[columnIndex].tasks.filter(sprintTask => sprintTask.taskId.toString() !== task.id.toString());
  //
  //         // minus task estimation from sprint total estimation
  //         sprintDetails.totalEstimation -= task.estimatedTime;
  //       }
  //
  //     }
  //     // endregion
  //
  //     // region add task to sprint
  //     if (newTasks.length) {
  //       newTasks = newTasks.map(task => this.toObjectId(task as string));
  //       // get all new tasks details
  //       const newTasksDetails = await this._taskService.dbModel.aggregate([
  //         {
  //           $match: {
  //             projectId: this.toObjectId(model.projectId),
  //             _id: { $in: newTasks },
  //             isDeleted: false
  //           }
  //         }
  //       ]);
  //
  //       // check all tasks are available in database
  //       if (newTasksDetails.length < newTasks.length) {
  //         throw new BadRequestException('one of tasks not found');
  //       }
  //
  //       // sprint error holder variable
  //       const sprintError: SprintErrorResponse = new SprintErrorResponse();
  //       sprintError.tasksErrors = [];
  //       sprintError.membersErrors = [];
  //
  //       // task assignee details holder variable
  //       const taskAssigneeMap: TaskAssigneeMap[] = [];
  //
  //       // loop over all the tasks
  //       newTasksDetails.forEach(task => {
  //         task.id = task['_id'];
  //
  //         // check if task is allowed to added to sprint
  //         this._sprintUtilityService.checkTaskIsAllowedToAddInSprint(task);
  //
  //         // no error then get task assignee id and push it to the task assignee mapping holder variable
  //         const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === task.assigneeId.toString());
  //
  //         // if assignee already added then only update it's totalEstimation
  //         if (assigneeIndex > -1) {
  //           taskAssigneeMap[assigneeIndex].totalEstimation += task.estimatedTime;
  //         } else {
  //           // push assignee to assignee task map holder variable
  //           taskAssigneeMap.push({
  //             // convert object id to string
  //             memberId: (task.assigneeId as any).toString(),
  //             totalEstimation: task.estimatedTime,
  //             workingCapacity: 0,
  //             alreadyLoggedTime: 0
  //           });
  //         }
  //       });
  //
  //       // region check exact capacity
  //       // if adjust hours not allowed then check for members capacity
  //       if (!model.adjustHoursAllowed) {
  //
  //         // get sprint count days from sprint start date and end date
  //         const sprintDaysCount = moment(sprintDetails.endAt).diff(sprintDetails.startedAt, 'd') || 1;
  //
  //         // fill member working capacity from sprint details in assignee task map holder variable
  //         sprintDetails.membersCapacity.forEach(member => {
  //           // find assignee index and update it's working capacity from sprint details
  //           const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === member.userId);
  //
  //           if (assigneeIndex > -1) {
  //             taskAssigneeMap[assigneeIndex].workingCapacity = Number(member.workingCapacity);
  //           }
  //         });
  //
  //         //
  //         // // loop over assignee's and get their logged time
  //         for (let i = 0; i < taskAssigneeMap.length; i++) {
  //           // get all already logged time for current sprint time span, commented out for version 2
  //
  //           // get assignee logged time for start and end date of sprint
  //           // const assigneeAlreadyLoggedForTheDate = await this._taskTimeLogService.find({
  //           // filter: {
  //           //   createdById: this.toObjectId(taskAssigneeMap[i].memberId),
  //           //   startedAt: { '$gte': moment(sprintDetails.startedAt).startOf('day').toDate() },
  //           //   endAt: { '$lt': moment(sprintDetails.endAt).endOf('day').toDate() },
  //           // });
  //           //
  //           // // calculate total of already logged time of assignee
  //           // if (assigneeAlreadyLoggedForTheDate && assigneeAlreadyLoggedForTheDate.length) {
  //           //   taskAssigneeMap[i].alreadyLoggedTime = assigneeAlreadyLoggedForTheDate.reduce((acc, cur) => {
  //           //     return acc + cur.loggedTime;
  //           //   }, 0);
  //           // }
  //
  //           // if assignee already logged time + assignee's total estimation from above sprint tasks
  //           // is greater
  //           // assignee working limit per sprint
  //           // return error ( member working capacity exceed )
  //
  //           if ((taskAssigneeMap[i].alreadyLoggedTime + taskAssigneeMap[i].totalEstimation) > hourToSeconds(taskAssigneeMap[i].workingCapacity)) {
  //             sprintError.membersErrors.push({
  //               id: taskAssigneeMap[i].memberId,
  //               reason: SprintErrorEnum.memberCapacityExceed
  //             });
  //           }
  //         }
  //
  //         // check if we found some errors while checking users availability
  //         if (sprintError.membersErrors.length) {
  //           return sprintError;
  //         }
  //       }
  //       // endregion
  //
  //       // now all validations have been completed add task to sprint
  //       for (let i = 0; i < newTasksDetails.length; i++) {
  //         const columnIndex = this._sprintUtilityService.getColumnIndexFromColumn(sprintDetails, newTasksDetails[i].statusId);
  //
  //         // check if task is already in any of sprint column
  //         const taskIsAlreadyInSprint = sprintDetails.columns.some(column => {
  //           return column.tasks.some(task => task.taskId === newTasksDetails[i].id);
  //         });
  //
  //         // if task is already in sprint then continue the loop to next iteration
  //         if (taskIsAlreadyInSprint) {
  //           continue;
  //         }
  //
  //         // add task estimation to sprint total estimation
  //         sprintDetails.totalEstimation += newTasksDetails[i].estimatedTime;
  //
  //         // add task estimation to column total estimation
  //         sprintDetails.columns[columnIndex].totalEstimation += newTasksDetails[i].estimatedTime;
  //         // add task to column
  //         sprintDetails.columns[columnIndex].tasks.push({
  //           taskId: newTasksDetails[i].id,
  //           addedAt: generateUtcDate(),
  //           addedById: this._generalService.userId,
  //           totalLoggedTime: 0
  //         });
  //       }
  //
  //       // set total remaining capacity by subtracting sprint members totalCapacity - totalEstimation
  //       sprintDetails.totalRemainingCapacity = sprintDetails.totalCapacity - sprintDetails.totalEstimation;
  //       sprintDetails.totalRemainingTime = sprintDetails.totalEstimation - sprintDetails.totalLoggedTime;
  //     }
  //     // endregion
  //
  //     // update sprint
  //     await this.updateById(model.sprintId, {
  //       $set: {
  //         columns: sprintDetails.columns,
  //         totalEstimation: sprintDetails.totalEstimation,
  //         totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
  //         totalRemainingTime: sprintDetails.totalRemainingTime
  //       }
  //     }, session);
  //
  //     // bulk update all removed tasks and set sprint id as null
  //     await this._taskService.bulkUpdate({ _id: { $in: removedTasks } }, { $set: { sprintId: null } }, session);
  //
  //     // bulk update all added tasks and set sprint id
  //     await this._taskService.bulkUpdate({ _id: { $in: newTasks } }, { $set: { sprintId: model.sprintId } }, session);
  //
  //     return {
  //       totalCapacity: sprintDetails.totalCapacity,
  //       totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
  //       totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
  //       totalRemainingCapacityReadable: secondsToString(sprintDetails.totalRemainingCapacity),
  //       totalEstimation: sprintDetails.totalEstimation,
  //       totalEstimationReadable: secondsToString(sprintDetails.totalEstimation),
  //       tasks: model.tasks
  //     };
  //   });
  // }

  /**
   * move task to a particular column
   * @param model
   */
  public async moveTaskToColumn(model: MoveTaskToColumnModel) {
    // region validation
    // column id
    if (!model.columnId) {
      throw new BadRequestException('Column not found');
    }

    //task
    if (!model.taskId) {
      throw new BadRequestException('Task not found');
    }
    // endregion

    // process moving
    await this.withRetrySession(async (session: ClientSession) => {
      await this._projectService.getProjectDetails(model.projectId);
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId, [], '');

      // gte column index where task is currently placed
      const currentColumnIndex = this._sprintUtilityService.getColumnIndexFromTask(sprintDetails, model.taskId);
      // check if column exits in sprint
      if (currentColumnIndex === -1) {
        BadRequest('Task not found in sprint');
      }

      // get new column index where task is dropped
      const newColumnIndex = this._sprintUtilityService.getColumnIndexFromColumn(sprintDetails, model.columnId);
      // check if new column exits in sprint
      if (newColumnIndex === -1) {
        BadRequest('Column not found where to move the task');
      }

      // if current and new column both are same then throw error
      if (currentColumnIndex === newColumnIndex) {
        BadRequest('Task Sorting not allowed');
      }

      // get task details
      const taskDetail: Task = await this._taskService.findOne({
        filter: {
          projectId: this.toObjectId(model.projectId),
          _id: model.taskId
        },
        lean: true
      });

      if (!taskDetail) {
        BadRequest('Task not found');
      }

      // check task is in given sprint
      if (taskDetail.sprintId.toString() !== model.sprintId) {
        throw new BadRequestException('Task is not added in sprint');
      }

      taskDetail.id = taskDetail._id.toString();

      // check task validity for moving in sprint
      this._sprintUtilityService.checkTaskIsAllowedToAddInSprint(taskDetail, true);

      // loop over columns
      // remove task from current column and add it to new column

      // get task that's going to move to new column
      const oldTask = sprintDetails.columns[currentColumnIndex].tasks.find(task => task.taskId.toString() === model.taskId);
      sprintDetails.columns = sprintDetails.columns.map((column, index) => {
        // remove from current column and minus estimation time from total column estimation time
        if (index === currentColumnIndex) {
          column.totalEstimation -= taskDetail.estimatedTime;
          column.tasks = column.tasks.filter(task => task.taskId.toString() !== model.taskId.toString());
        }

        // add task to new column and also add task estimation to column total estimation
        if (index === newColumnIndex) {
          column.totalEstimation += taskDetail.estimatedTime;
          column.tasks.push({
            taskId: oldTask.taskId,
            addedAt: generateUtcDate(),
            addedById: this._generalService.userId,
            description: SprintActionEnum.taskMovedToColumn,
            totalLoggedTime: oldTask.totalLoggedTime
          });
        }

        return column;
      });

      // update sprint columns
      await this.updateById(model.sprintId, {
        $set: {
          'columns': sprintDetails.columns
        }
      }, session);

      // update task status to the column where the task is dropped
      await this._taskService.updateById(model.taskId, {
        $set: {
          statusId: sprintDetails.columns[newColumnIndex].statusId
        }
      }, session);

      // create task history as task status updated by moving task in sprint
      const history = new TaskHistory();
      history.sprintId = model.sprintId;
      history.action = TaskHistoryActionEnum.statusChanged;
      history.createdById = this._generalService.userId;
      history.taskId = model.taskId;
      history.task = taskDetail;
      history.desc = SprintActionEnum.taskMovedToColumn;

      // add task history
      await this._taskHistoryService.addHistory(history, session);
    });

    // return whole sprint details
    const sprint = await this.getSprintDetails(model.sprintId, model.projectId, detailedPopulationForSprint, detailedFiledSelection);
    return this._sprintUtilityService.prepareSprintVm(sprint);
  }

  /**
   * update member working capacity for sprint
   * @param model: UpdateSprintMemberWorkingCapacity[]
   */
  public async updateSprintMemberWorkingCapacity(model: UpdateSprintMemberWorkingCapacity) {
    return await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      // validations
      this._sprintUtilityService.updateMemberCapacityValidations(model, projectDetails);

      // get sprint details by id
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId);

      if (sprintDetails.sprintStatus) {
        let msgStatus = '';
        // switch over sprint status
        switch (sprintDetails.sprintStatus.status) {
          case SprintStatusEnum.inProgress:
            msgStatus = 'Published';
            break;
          case SprintStatusEnum.closed:
            msgStatus = 'Closed';
            break;
          case SprintStatusEnum.completed:
            msgStatus = 'Completed';
        }

        throw new BadRequestException(`Sprint is already ${msgStatus}! You can not change it's Capacity`);
      }

      // check if all members are part of the sprint
      const everyMemberThereInSprint = model.capacity.every(member => sprintDetails.membersCapacity.some(proejctMember => proejctMember.userId === member.memberId));
      if (!everyMemberThereInSprint) {
        throw new BadRequestException('One of member is not member in Sprint!');
      }

      // total working capacity holder variable
      let totalWorkingCapacity = 0;

      // update members capacity in sprint details model
      sprintDetails.membersCapacity.forEach(sprintMember => {
        const indexOfMemberInRequestedModal = model.capacity.findIndex(capacity => capacity.memberId === sprintMember.userId);

        if (indexOfMemberInRequestedModal > -1) {
          // convert member capacity hours to seconds
          sprintMember.workingCapacity = hourToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacity);
          sprintMember.workingCapacityPerDay = hourToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacityPerDay);
          sprintMember.workingDays = model.capacity[indexOfMemberInRequestedModal].workingDays;
        }
        totalWorkingCapacity += sprintMember.workingCapacity;
      });

      sprintDetails.totalRemainingCapacity = totalWorkingCapacity - sprintDetails.totalEstimation;

      // update object for sprint member capacity
      const updateObject = {
        $set: {
          membersCapacity: sprintDetails.membersCapacity,
          totalCapacity: totalWorkingCapacity,
          totalRemainingCapacity: sprintDetails.totalRemainingCapacity
        }
      };
      // update sprint in database
      await this.updateById(model.sprintId, updateObject, session);

      // return sprint totals
      return {
        totalCapacity: sprintDetails.totalCapacity,
        totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
        totalEstimation: sprintDetails.totalEstimation,
        totalEstimationReadable: secondsToString(sprintDetails.totalEstimation),
        totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
        totalRemainingCapacityReadable: secondsToString(sprintDetails.totalRemainingCapacity)
      };
    });
  }

  /**
   * publish sprint
   * this will publish a requested sprint
   * check the basic validation like valid sprint id, valid project id, valid member
   * then advance validations like start date can not be before today, end date cannot be before today, published date can not be in between sprint start and end date
   * update sprint status to in progress and send mail to all the sprint members
   * @param model: PublishSprintModel
   */
  public async publishSprint(model: PublishSprintModel) {
    return await this.withRetrySession(async (session: ClientSession) => {
      await this._projectService.getProjectDetails(model.projectId);

      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId, commonPopulationForSprint, detailedFiledSelection);

      if (sprintDetails.sprintStatus) {
        BadRequest(`This sprint can't be published, because sprint is already ${sprintDetails.sprintStatus}`);
      }

      // check validations
      this._sprintUtilityService.publishSprintValidations(sprintDetails);

      // update sprint in db
      await this.updateById(model.sprintId, {
        $set: {
          sprintStatus: {
            status: SprintStatusEnum.inProgress, updatedAt: generateUtcDate(), updatedById: this._generalService.userId
          }
        }
      }, session);

      // update project and set published sprint as active sprint in project
      await this._projectService.updateById(model.projectId, { $set: { sprintId: model.sprintId } }, session);

      // send publish sprint emails
      this._sprintUtilityService.sendPublishedSprintEmails(sprintDetails);

      return sprintDetails;
    });
  }

  /**
   * get un-published sprint details
   * sprint which is not published yet and it's end date is after today
   * @param projectId
   * @returns {Promise<DocumentQuery<(Sprint & Document)[], Sprint & Document> & {}>}
   */
  public async getUnPublishSprint(projectId: string) {
    const projectDetails = await this._projectService.getProjectDetails(projectId);

    // create query object for sprint
    const queryObjectForUnPublishedSprint = {
      isDeleted: false,
      projectId: projectId,
      endAt: { $gt: moment().startOf('d').toDate() },
      'sprintStatus.status': { $in: [undefined, null] }
    };

    // return founded sprint
    let sprint: Sprint = await this._sprintModel.findOne(queryObjectForUnPublishedSprint).populate(detailedPopulationForSprint).sort('-createdAt').lean();

    if (!sprint) {
      return 'No Unpublished Sprint Found';
    }

    // prepare sprint vm model
    sprint = this._sprintUtilityService.prepareSprintVm(sprint);
    return sprint;
  }

  /**
   * close the sprint
   * @param model
   */
  public async closeSprint(model: CloseSprintModel) {
    return await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);

      // get current sprint details
      const currentSprintDetails = await this.getSprintDetails(model.sprintId, model.projectId);

      // check if sprint is running
      if (!currentSprintDetails.sprintStatus || currentSprintDetails.sprintStatus.status !== SprintStatusEnum.inProgress) {
        BadRequest('This sprint is not running you can not close it');
      }

      // get all sprint task list
      const allTaskList: Task[] = [];
      currentSprintDetails.columns.forEach(column => {
        column.tasks.forEach(task => {
          allTaskList.push(task.task);
        });
      });

      // get last column of sprint and last column statuses because we consider last column as completed status of a task for a sprint
      const lastColumn = currentSprintDetails.columns[currentSprintDetails.columns.length - 1];

      // get all unfinished tasks
      const unFinishedTasks = allTaskList.filter(task => {
        return task.statusId.toString() !== lastColumn.statusId.toString();
      }).map(task => {
        task.id = task._id.toString();
        return task;
      });

      const unFinishedTasksIds = unFinishedTasks.map(task => task._id.toString());

      // get all finished tasks
      const finishedTasksIds = allTaskList.filter(task => {
        return task.statusId.toString() === lastColumn.statusId.toString();
      }).map(task => task._id.toString());


      // check if sprint has tasks
      if (!allTaskList.length) {
        BadRequest('This Sprint don\'t have any tasks');
      }

      let responseMsg = '';

      if (model.createNewSprint) {
        // create new sprint and move all un-Finished task of this sprint to new sprint

        // new sprint process
        const newSprint = await this.createSprintCommonProcess({
          sprint: model.sprint, doPublishSprint: model.createAndPublishNewSprint, unFinishedTasks
        }, projectDetails, session);

        // close current sprint and set new sprint id to unfinished tasks
        await this.closeSprintCommonProcess(model.projectId, unFinishedTasksIds,
          newSprint[0].id, session);

        // update finished tasks and set sprint id to null
        await this._taskService.bulkUpdate({
          _id: { $in: finishedTasksIds }
        }, { $set: { sprintId: null } }, session);

        // check if create and publish new sprint is true than send emails
        if (model.createAndPublishNewSprint && newSprint) {
          // send mails for sprint published
          const sprintDetails = await this.getSprintDetails(newSprint[0].id, model.projectId);
          this._sprintUtilityService.sendPublishedSprintEmails(sprintDetails);
        }
        responseMsg = newSprint[0];
      } else {
        // close current sprint and move finished and un-finished tasks to back log
        await this.closeSprintCommonProcess(model.projectId, [...unFinishedTasksIds, ...finishedTasksIds], null, session);

        responseMsg = `Sprint Closed Successfully`;
      }

      // create sprint status object
      const sprintStatus = new SprintStatus();
      sprintStatus.status = SprintStatusEnum.closed;
      sprintStatus.updatedAt = generateUtcDate();
      sprintStatus.updatedById = this._generalService.userId;

      // close old sprint and set staus as completed
      await this.updateSprintStatus(model.sprintId, sprintStatus, session);
      return responseMsg;
    });
  }

  /**
   * reassign sprint when a board get's updated
   * @param activeBoard
   * @param activeSprint
   */
  public reassignSprintColumns(activeBoard: BoardModel, activeSprint: Sprint) {
    return this._sprintUtilityService.reassignSprintColumns(activeBoard, activeSprint);
  }

  /**
   * close sprint common process
   * set sprint id to all tasks
   * set sprint id to current project
   * @param projectId
   * @param allTaskList
   * @param sprintId
   * @param session
   */
  private async closeSprintCommonProcess(projectId: string, allTaskList: string[], sprintId: string, session: ClientSession) {
    // update all task and assign sprint id to all of them using bulk update
    await this._taskService.bulkUpdate({
      _id: { $in: allTaskList }
    }, { $set: { sprintId } }, session);

    // update project and set sprint id
    await this._projectService.updateById(projectId, { $set: { sprintId } }, session);
  }

  /**
   * update sprint status process
   * @param sprintId
   * @param sprintStatus
   * @param session
   */
  private async updateSprintStatus(sprintId: string, sprintStatus: SprintStatus, session: ClientSession) {
    // update sprint status
    return this.updateById(sprintId, {
      $set: { sprintStatus }
    }, session);
  }

  /**
   * create sprint
   * @param model
   * @param projectDetails
   * @param session
   */
  private async createSprintCommonProcess(model: CreateSprintCloseSprintCommonModel, projectDetails: Project, session: ClientSession) {

    const sprintModel = new Sprint();
    sprintModel.projectId = model.sprint.projectId;
    sprintModel.name = model.sprint.name;
    sprintModel.goal = model.sprint.goal;
    sprintModel.startedAt = model.sprint.startedAt;
    sprintModel.endAt = model.sprint.endAt;
    sprintModel.createdById = this._generalService.userId;
    sprintModel.totalEstimation = 0;
    sprintModel.totalLoggedTime = 0;
    sprintModel.totalOverLoggedTime = 0;

    // perform common validations
    this._sprintUtilityService.commonSprintValidator(sprintModel);

    if (!projectDetails.activeBoard) {
      BadRequest('Active board not found, Sprint can not be created');
    }

    // sprint duplicate name validation per project
    if (await this.isDuplicate(sprintModel)) {
      BadRequest('Duplicate Sprint Name is not allowed');
    }

    // add all project collaborators as sprint member and add their's work capacity to total capacity
    sprintModel.membersCapacity = [];
    sprintModel.totalCapacity = 0;

    // add only those members who accepted invitation of project means active collaborator of project
    projectDetails.members.filter(member => member.isInviteAccepted).forEach(member => {
      sprintModel.membersCapacity.push({
        userId: member.userId,
        workingCapacity: member.workingCapacity,
        workingCapacityPerDay: member.workingCapacityPerDay,
        workingDays: member.workingDays
      });
      sprintModel.totalCapacity += Number(member.workingCapacity);
    });

    // create columns array for sprint from project
    sprintModel.columns = [];
    projectDetails.activeBoard.columns.forEach(column => {
      const sprintColumn = new SprintColumn();
      sprintColumn.name = column.headerStatus.name;
      sprintColumn.id = column.headerStatusId;
      sprintColumn.statusId = column.headerStatusId;
      sprintColumn.tasks = [];
      sprintColumn.totalEstimation = 0;
      sprintColumn.isHidden = column.isHidden;

      sprintModel.columns.push(sprintColumn);
    });

    /** special cases for close sprint **/
    // if create and publish new sprint is selected than set sprint as a published one sprint
    if (model.doPublishSprint) {
      sprintModel.sprintStatus = {
        status: SprintStatusEnum.inProgress, updatedAt: generateUtcDate(), updatedById: this._generalService.userId
      };
    }

    // if there's unFinished tasks than we need to move those to new sprint
    if (model.unFinishedTasks && model.unFinishedTasks.length) {
      // loop over un finished tasks and add them to respective columns of this sprint
      model.unFinishedTasks.forEach(unFinishedTask => {
        this._sprintUtilityService.addTaskToColumn(projectDetails, sprintModel, unFinishedTask, this._generalService.userId);
      });
    }

    // create sprint
    return await this.create([sprintModel], session);
  }

  /**
   * add task to sprint db process
   * @param project
   * @param sprintDetails
   * @param taskDetails
   * @param session
   */
  private async processAddTaskToSprint(project: Project, sprintDetails: Sprint, taskDetails: Task, session: ClientSession) {

    // adds a task to column by using task's status
    this._sprintUtilityService.addTaskToColumn(project, sprintDetails, taskDetails, this._generalService.userId);

    // get column index where task is added
    const columnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, taskDetails.statusId);

    // update sprint by id and update sprint columns
    await this.updateById(sprintDetails.id, {
      $set: {
        [`columns.${columnIndex}`]: sprintDetails.columns[columnIndex],
        totalEstimation: sprintDetails.totalEstimation,
        totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
        totalRemainingTime: sprintDetails.totalRemainingTime
      }
    }, session);

    // create task history
    const taskHistory = new TaskHistory();
    taskHistory.desc = TaskHistoryActionEnum.addedToSprint;
    taskHistory.action = TaskHistoryActionEnum.addedToSprint;
    taskHistory.createdAt = generateUtcDate();
    taskHistory.createdById = this._generalService.userId;
    taskHistory.taskId = taskDetails.id;
    taskHistory.sprintId = sprintDetails.id;

    await this._taskHistoryService.addHistory(taskHistory, session);

    // update task by id and set sprint id
    await this._taskService.updateById(taskDetails.id, { $set: { sprintId: sprintDetails.id } }, session);

    return {
      totalCapacity: sprintDetails.totalCapacity,
      totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
      totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
      totalRemainingCapacityReadable: secondsToString(sprintDetails.totalRemainingCapacity),
      totalEstimation: sprintDetails.totalEstimation,
      totalEstimationReadable: secondsToString(sprintDetails.totalEstimation)
    };
  }

  /**
   * is duplicate sprint name
   * @param model
   * @param exceptThis
   */
  private async isDuplicate(model: Sprint, exceptThis?: string): Promise<boolean> {
    const queryFilter = {
      projectId: model.projectId, name: { $regex: `^${model.name.trim()}$`, $options: 'i' }
    };

    if (exceptThis) {
      queryFilter['_id'] = { $ne: exceptThis };
    }

    const queryResult = await this.find({
      filter: queryFilter
    });

    return !!(queryResult && queryResult.length);
  }

  /**
   * get sprint details by sprint id
   * @param sprintId
   * @param projectId
   * @param populate: population array
   * @param select: filed selection string
   */
  public async getSprintDetails(sprintId: string, projectId: string, populate: any[] = detailedPopulationForSprint, select: string = detailedFiledSelection): Promise<Sprint> {
    if (!this.isValidObjectId(sprintId)) {
      throw new BadRequestException('Sprint Not Found');
    }
    const sprintDetails: Sprint = await this.findOne({
      filter: { _id: sprintId, projectId },
      populate,
      lean: true,
      select
    });

    if (!sprintDetails) {
      throw new NotFoundException('Sprint Not Found');
    }
    sprintDetails.id = sprintDetails._id.toString();
    return sprintDetails;
  }
}
