import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  AddTaskToSprintModel,
  BasePaginatedResponse,
  BoardModel,
  CloseSprintModel,
  CreateSprintCloseSprintCommonModel,
  CreateSprintModel,
  DbCollection,
  EmailSubjectEnum,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel, MongooseQueryModel,
  MoveTaskToColumnModel,
  Project,
  PublishSprintModel,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintActionEnum, SprintBaseRequest,
  SprintColumn,
  SprintDurationsModel,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintErrorResponseItem,
  SprintFilterTasksModel,
  SprintStatus,
  SprintStatusEnum,
  Task,
  TaskHistory,
  TaskHistoryActionEnum,
  UpdateSprintMemberWorkingCapacity,
  UpdateSprintModel
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from '../general.service';
import * as moment from 'moment';
import { BadRequest, generateUtcDate, hourToSeconds, secondsToString } from '../../helpers/helpers';
import { TaskService } from '../task/task.service';
import { ModuleRef } from '@nestjs/core';
import { SprintUtilityService } from './sprint.utility.service';
import { TaskHistoryService } from '../task-history.service';
import { ProjectService } from '../project/project.service';
import { BoardUtilityService } from '../board/board.utility.service';
import { EmailService } from '../email.service';
import { SprintReportService } from '../sprint-report/sprint-report.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';

const commonPopulationForSprint = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName profilePic',
  justOne: true
}, {
  path: 'updatedBy',
  select: 'emailId userName firstName lastName profilePic',
  justOne: true
}, {
  path: 'membersCapacity.user',
  select: 'emailId userName firstName lastName profilePic',
  justOne: true
}];

const detailedPopulationForSprint = [...commonPopulationForSprint, {
  path: 'columns.tasks.addedBy',
  select: 'emailId userName firstName lastName profilePic',
  justOne: true
}, {
  path: 'columns.tasks.task',
  select: 'name displayName description tags sprintId priorityId taskTypeId statusId assigneeId estimatedTime remainingTime overLoggedTime totalLoggedTime createdById createdAt',
  justOne: true,
  populate: [{
    path: 'assignee',
    select: 'emailId userName firstName lastName profilePic',
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

const commonFieldSelection = 'name startedAt endAt goal sprintStatus membersCapacity totalCapacity totalEstimation totalLoggedTime totalOverLoggedTime createdById updatedById removedById removedAt projectId reportId';
const detailedFiledSelection = `${commonFieldSelection} columns`;

@Injectable()
export class SprintService extends BaseService<Sprint & Document> implements OnModuleInit {

  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _taskHistoryService: TaskHistoryService;
  private _sprintReportService: SprintReportService;

  private _sprintUtilityService: SprintUtilityService;
  private _boardUtilityService: BoardUtilityService;

  constructor(
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    private _generalService: GeneralService, private _moduleRef: ModuleRef, private _emailService: EmailService
  ) {
    super(_sprintModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');
    this._sprintReportService = this._moduleRef.get('SprintReportService');

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
   * filter sprint tasks user wise and search tasks by name, description, display name and tags
   * @param model
   */
  public async filterSprintTasks(model: SprintFilterTasksModel) {
    try {
      if (!model || !model.projectId) {
        BadRequest('Project not found');
      }

      await this._projectService.getProjectDetails(model.projectId);
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId);

      model.query = model.query ? model.query.toLowerCase() : '';

      // filter sprint columns with query model we got from request
      sprintDetails.columns = sprintDetails.columns.map(column => {

        // filter tasks assignee wise
        column.tasks = column.tasks.filter(task => {
          if (model.assigneeIds && model.assigneeIds.length) {
            return model.assigneeIds.includes(task.task.assigneeId.toString());
          }
          return task;
        });

        // filter tasks with query term
        // on name, displayName, description, and tags
        column.tasks = column.tasks.filter(task => {
          return (
            task.task.name.toLowerCase().indexOf(model.query) > -1 ||
            task.task.displayName.toLowerCase().indexOf(model.query) > -1 ||
            (task.task.description ? task.task.description.toLowerCase().indexOf(model.query) > -1 : '') ||
            (task.task.assignee ? task.task.assignee.firstName.toLowerCase().indexOf(model.query) > -1 : '') ||
            (task.task.assignee ? task.task.assignee.lastName.toLowerCase().indexOf(model.query) > -1 : '') ||
            (task.task.assignee ? task.task.assignee.emailId.toLowerCase().indexOf(model.query) > -1 : '') ||
            task.task.tags.includes(model.query)
          );
        });

        return column;
      });

      // convert to vm and return vm
      return this._sprintUtilityService.prepareSprintVm(sprintDetails);
    } catch (e) {
      throw e;
    }
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

      // check if report is available
      if (sprintDetails.reportId) {
        // remove task from sprint report
        await this._sprintReportService.removeTaskFromReport(sprintDetails.reportId, taskDetails.id, session);
      }

      // create task history
      const taskHistory = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.removedFromSprint, taskDetails.id, taskDetails,
        sprintDetails.id);
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

      // get task details
      const taskDetail: Task = await this._taskService.getTaskDetails(model.taskId, model.projectId);

      // get report details
      const sprintReport: SprintReportModel = await this._sprintReportService.getSprintReportDetails(sprintDetails.reportId);

      // check task is in given sprint
      if (taskDetail.sprintId.toString() !== model.sprintId) {
        BadRequest('Task is not part of this sprint');
      }

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

      taskDetail.id = taskDetail._id.toString();

      // check task validity for moving in sprint
      this._sprintUtilityService.checkTaskIsAllowedToAddInSprint(taskDetail, true);

      // loop over columns
      // remove task from current column and add it to new column

      // get task from sprint column that's going to move to new column
      const oldSprintTask = sprintDetails.columns[currentColumnIndex].tasks.find(task => task.taskId.toString() === model.taskId);

      // move task to new column and remove from old column
      sprintDetails.columns = this._sprintUtilityService.moveTaskToNewColumn(sprintDetails, taskDetail, oldSprintTask,
        this._generalService.userId, currentColumnIndex, newColumnIndex);

      // update sprint columns
      await this.updateById(model.sprintId, {
        $set: {
          'columns': sprintDetails.columns
        }
      }, session);

      // update sprint report
      // find task in sprint report
      const taskIndexInReport = sprintReport.reportTasks.findIndex(task => {
        return task.taskId.toString() === taskDetail.id.toString();
      });

      // update task status id as sprint column
      const updateReportObject = {
        $set: {
          [`reportTasks.${taskIndexInReport}.statusId`]: sprintDetails.columns[newColumnIndex].statusId
        }
      };

      // update report by id
      await this._sprintReportService.updateById(sprintDetails.reportId, updateReportObject, session);

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
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);

      // get sprint details
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId);

      if (sprintDetails.sprintStatus) {
        BadRequest(`This sprint can't be published, because sprint is already ${sprintDetails.sprintStatus}`);
      }

      // check validations
      this._sprintUtilityService.publishSprintValidations(sprintDetails);

      // create sprint report
      const sprintReport = await this._sprintReportService.createReport(sprintDetails, projectDetails, session);

      // update sprint in db
      await this.updateById(model.sprintId, {
        $set: {
          sprintStatus: {
            status: SprintStatusEnum.inProgress, updatedAt: generateUtcDate(), updatedById: this._generalService.userId
          },
          reportId: sprintReport[0].id
        }
      }, session);

      // update project and set published sprint as active sprint in project
      await this._projectService.updateById(model.projectId, { $set: { sprintId: model.sprintId } }, session);

      // send publish sprint emails
      this._sprintUtilityService.sendSprintEmails(sprintDetails, EmailSubjectEnum.sprintPublished);

      return sprintDetails;
    });
  }

  /**
   * get un-published sprint details
   * sprint which is not published yet and it's end date is after today
   * @param projectId
   */
  public async getUnPublishSprint(projectId: string) {
    try {
      await this._projectService.getProjectDetails(projectId);

      // create query object for sprint
      const queryObjectForUnPublishedSprint: MongooseQueryModel = {
        filter: {
          projectId: projectId,
          endAt: { $gt: moment().startOf('d').toDate() },
          'sprintStatus.status': { $in: [undefined, null] }
        },
        select: '-columns -membersCapacity', lean: true, sort: '-createdAt'
      };

      // return founded sprint
      const sprint: Sprint = await this.findOne(queryObjectForUnPublishedSprint);
      if (!sprint) {
        return 'No Unpublished Sprint Found';
      }

      // prepare sprint vm model
      return this._sprintUtilityService.prepareSprintVm(sprint);
    } catch (e) {
      throw e;
    }
  }

  /**
   * get all closed sprint list
   * @param projectId
   */
  public async getClosedSprintsList(projectId: string) {
    try {
      // get project details
      await this._projectService.getProjectDetails(projectId);

      // get all closed sprints query
      const sprints = await this.find({
        filter: { [`sprintStatus.status`]: SprintStatusEnum.closed, projectId },
        select: 'name goal'
      });

      // check if sprint found
      if (sprints && sprints.length) {
        // map over sprints and assign id
        return sprints.map(sprint => {
          sprint.id = sprint._id.toString();
          return sprint;
        });
      } else {
        return [];
      }
    } catch (e) {
      throw e;
    }
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

      if (model.createNewSprint) {
        // create new sprint and move all un-Finished task of this sprint to new sprint

        // new sprint process
        const newSprint = await this.createSprintCommonProcess({
          sprint: model.sprint, doPublishSprint: model.createAndPublishNewSprint, unFinishedTasks
        }, projectDetails, session);

        // close current sprint and set new sprint id to unfinished tasks
        await this.closeSprintCommonProcess(model.projectId, model.createAndPublishNewSprint, unFinishedTasksIds, newSprint[0].id, session);

        // update finished tasks and set sprint id to null
        await this._taskService.bulkUpdate({
          _id: { $in: finishedTasksIds }
        }, { $set: { sprintId: null } }, session);

      } else {
        // close current sprint and move finished and un-finished tasks to back log
        await this.closeSprintCommonProcess(model.projectId, false, [...unFinishedTasksIds, ...finishedTasksIds], null, session);
      }

      // create sprint status object
      const sprintStatus = new SprintStatus();
      sprintStatus.status = SprintStatusEnum.closed;
      sprintStatus.updatedAt = generateUtcDate();
      sprintStatus.updatedById = this._generalService.userId;

      // close old sprint and set staus as completed
      await this.updateSprintStatus(model.sprintId, sprintStatus, session);

      // get sprint details
      const sprintDetails = await this.getSprintDetails(model.sprintId, model.projectId);
      this._sprintUtilityService.calculateSprintEstimates(sprintDetails);

      // send emails for sprint is closed
      this._sprintUtilityService.sendSprintEmails(sprintDetails, EmailSubjectEnum.sprintClosed);

      // check if create and publish new sprint is true than send emails
      if (model.createAndPublishNewSprint) {
        // send mails for sprint published
        this._sprintUtilityService.sendSprintEmails(sprintDetails, EmailSubjectEnum.sprintPublished);
      }

      return sprintDetails;
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
   * @param publishSprint
   * @param allTaskList
   * @param sprintId
   * @param session
   */
  private async closeSprintCommonProcess(projectId: string, publishSprint: boolean, allTaskList: string[], sprintId: string, session: ClientSession) {
    // update all task and assign sprint id to all of them using bulk update
    await this._taskService.bulkUpdate({
      _id: { $in: allTaskList }
    }, { $set: { sprintId } }, session);

    // update project and set sprint id
    // if sprint is going to published than set new sprintId from new sprint id else set it to null
    await this._projectService.updateById(projectId, { $set: { sprintId: publishSprint ? sprintId : null } }, session);
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
        totalRemainingTime: sprintDetails.totalRemainingTime,
        totalOverLoggedTime: sprintDetails.totalRemainingTime >= 0 ? 0 : Math.abs(sprintDetails.totalRemainingTime)
      }
    }, session);

    // if sprint is published than add task to report
    if (sprintDetails.sprintStatus && sprintDetails.sprintStatus.status === SprintStatusEnum.inProgress) {
      // add task to sprint report
      await this._sprintReportService.addTaskInSprintReport(sprintDetails.reportId, taskDetails, session);
    }

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
