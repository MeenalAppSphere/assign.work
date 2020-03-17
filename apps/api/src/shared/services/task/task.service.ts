import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  BasePaginatedResponse,
  DbCollection,
  DeleteTaskModel,
  GetAllTaskRequestModel,
  GetTaskByIdOrDisplayNameModel,
  Project, Sprint,
  SprintStatusEnum,
  Task,
  TaskFilterCondition,
  TaskFilterModel,
  TaskHistory,
  TaskHistoryActionEnum
} from '@aavantan-app/models';
import { ClientSession, Document, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskHistoryService } from '../task-history.service';
import { GeneralService } from '../general.service';
import { BadRequest, stringToSeconds, toObjectId } from '../../helpers/helpers';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';
import { SprintService } from '../sprint/sprint.service';
import { ModuleRef } from '@nestjs/core';
import { TaskTypeService } from '../task-type/task-type.service';
import { TaskPriorityService } from '../task-priority/task-priority.service';
import { TaskStatusService } from '../task-status/task-status.service';
import { ProjectService } from '../project/project.service';
import { TaskUtilityService } from './task.utility.service';
import { ProjectUtilityService } from '../project/project.utility.service';
import { basicUserDetailsForAggregateQuery } from '../../helpers/aggregate.helper';
import { SprintUtilityService } from '../sprint/sprint.utility.service';
import { BoardUtilityService } from '../board/board.utility.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { SprintReportService } from '../sprint-report/sprint-report.service';

/**
 * common task population object
 */
const taskBasicPopulation: any[] = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'updatedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'assignee',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'status',
  select: 'name',
  justOne: true
}, {
  path: 'taskType',
  select: 'name displayName color',
  justOne: true
}, {
  path: 'priority',
  select: 'name color',
  justOne: true
}];

const taskFullPopulation: any[] = [
  ...taskBasicPopulation,
  {
    path: 'watchersDetails',
    select: 'emailId userName firstName lastName profilePic _id'
  }, {
    path: 'dependentItem',
    select: 'name displayName description url',
    justOne: true
  }, {
    path: 'relatedItem',
    select: 'name displayName description url',
    justOne: true
  }, {
    path: 'attachmentsDetails'
  }, {
    path: 'sprint',
    select: 'name goal',
    justOne: true
  }
];

@Injectable()
export class TaskService extends BaseService<Task & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _sprintService: SprintService;
  private _sprintReportService: SprintReportService;
  private _taskTypeService: TaskTypeService;
  private _taskPriorityService: TaskPriorityService;
  private _taskStatusService: TaskStatusService;
  private _taskHistoryService: TaskHistoryService;

  private _utilityService: TaskUtilityService;
  private _projectUtilityService: ProjectUtilityService;
  private _sprintUtilityService: SprintUtilityService;
  private _boardUtilityService: BoardUtilityService;

  constructor(
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    private _generalService: GeneralService, private _moduleRef: ModuleRef
  ) {
    super(_taskModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');
    this._sprintService = this._moduleRef.get('SprintService');
    this._sprintReportService = this._moduleRef.get('SprintReportService');
    this._taskTypeService = this._moduleRef.get('TaskTypeService');
    this._taskPriorityService = this._moduleRef.get('TaskPriorityService');
    this._taskStatusService = this._moduleRef.get('TaskStatusService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');

    this._utilityService = new TaskUtilityService();
    this._projectUtilityService = new ProjectUtilityService();
    this._sprintUtilityService = new SprintUtilityService();
    this._boardUtilityService = new BoardUtilityService();
  }

  /**
   * get all tasks
   * @param model : request model includes project id and filter params
   * @param onlyMyTask: show only my task
   */
  async getAllTasks(model: GetAllTaskRequestModel, onlyMyTask: boolean = false): Promise<Partial<BasePaginatedResponse<Task>>> {
    await this._projectService.getProjectDetails(model.projectId);

    // set populate fields
    model.populate = [{
      path: 'createdBy',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }, {
      path: 'assignee',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }, {
      path: 'status',
      select: 'name',
      justOne: true
    }, {
      path: 'taskType',
      select: 'name displayName color',
      justOne: true
    }, {
      path: 'priority',
      select: 'name color',
      justOne: true
    }];

    // set selection fields
    model.select = '_id name taskTypeId priorityId statusId sprintId createdById assigneeId progress overProgress totalLoggedTime estimatedTime remainingTime overLoggedTime displayName';

    let filter = {};
    if (onlyMyTask) {
      filter = {
        projectId: model.projectId,
        $or: [{ assigneeId: this._generalService.userId }, { createdById: this._generalService.userId }]
      };
    } else {
      filter = { projectId: model.projectId };
    }

    // get task for only backlogs
    if (model.onlyBackLog) {
      filter = { ...filter, $or: [{ sprintId: { $exists: false } }, { sprintId: null }] };
    } else if (model.sprintId) {
      // get task of a specific sprint
      filter = { sprintId: model.sprintId };
    }

    const result: BasePaginatedResponse<Task> = await this.getAllPaginatedData(filter, model);

    result.items = result.items.map(task => {
      return this._utilityService.prepareTaskVm(task);
    });

    return result;
  }

  /**
   * add task service accept a single parameter task object
   * @param model: Task
   */
  async addTask(model: Task): Promise<Task> {
    const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);

    // new task process
    const newTask = await this.withRetrySession(async (session: ClientSession) => {

      const taskTypeDetails = await this._taskTypeService.getDetails(model.projectId, model.taskTypeId);

      // prepare task model
      const taskModel = this._utilityService.prepareTaskObjectFromRequest(model, projectDetails);

      if (!taskTypeDetails) {
        BadRequest('Task Type not found');
      }

      const lastTask = await this._taskModel.find({
        projectId: taskModel.projectId
      }).sort({ _id: -1 }).limit(1).select('_id, displayName').lean();

      if (lastTask[0]) {
        // tslint:disable-next-line:radix
        const lastInsertedNo = parseInt(lastTask[0].displayName.split('-')[1]);
        taskModel.displayName = `${taskTypeDetails.displayName}-${lastInsertedNo + 1}`;
      } else {
        taskModel.displayName = `${taskTypeDetails.displayName}-1`;
      }

      // check if task assignee id is available or not
      // if not then assign it to task creator
      taskModel.assigneeId = taskModel.assigneeId || this._generalService.userId;

      // add task creator and assignee as default watcher
      taskModel.watchers = [
        ...new Set([
          this._generalService.userId,
          taskModel.assigneeId,
          ...taskModel.watchers
        ])
      ];

      // check if tags is undefined assign blank array to that, this is the check for old data
      projectDetails.settings.tags = projectDetails.settings.tags ? projectDetails.settings.tags : [];

      // tags processing
      // if any tag found that is not in projectDetails then need to add that in project
      const isNewTag = taskModel.tags.some(s => {
        return !(projectDetails.settings.tags.map(tag => tag.name).includes(s));
      });

      if (isNewTag) {
        const newTags = [...new Set([...taskModel.tags, ...projectDetails.settings.tags.map(tag => tag.name)])];

        // const newTags = xorWith(model.tags, projectDetails.settings.tags.map(m => m.name), isEqual);
        if (newTags.length) {
          projectDetails.settings.tags = newTags.map(tag => {
            return {
              name: tag,
              id: new Types.ObjectId().toHexString()
            };
          });

          await this._projectService.updateById(taskModel.projectId, {
            $set: { 'settings.tags': projectDetails.settings.tags }
          }, session);
        }
      }

      taskModel.createdById = this._generalService.userId;
      const createdTask = await this.create([taskModel], session);
      const taskHistory: TaskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskCreated, createdTask[0].id, createdTask[0]);
      await this._taskHistoryService.addHistory(taskHistory, session);
      return createdTask[0];
    });

    // get new task details and return it
    try {
      const task: Task = await this._taskModel.findOne({
        _id: newTask.id, projectId: newTask.projectId
      }).populate(taskFullPopulation).select('-comments').lean().exec();

      if (!task) {
        BadRequest('Task not found');
      }

      // task is created now send all the mails
      this._utilityService.sendMailForTaskCreated(task, projectDetails);

      return this._utilityService.prepareTaskVm(task);
    } catch (e) {
      throw e;
    }
  }

  /**
   * update task
   * if task type changed than update display name too
   * if estimate has been added after one have logged overs re calculate progress and over progress
   * @param model: Task
   */
  async updateTask(model: Task): Promise<Task> {
    if (!model || !model.id) {
      BadRequest('Task not found');
    }

    const taskModel = new Task();
    const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);
    let isAssigneeChanged = false;

    // update task process
    await this.withRetrySession(async (session: ClientSession) => {

      const taskDetails = await this.getTaskDetails(model.id, model.projectId);

      // assign property to task model
      taskModel.id = model.id;
      taskModel.name = model.name;
      taskModel.displayName = model.displayName;
      taskModel.description = model.description;
      taskModel.tags = model.tags;

      taskModel.taskTypeId = model.taskTypeId;
      taskModel.priorityId = model.priorityId;
      taskModel.statusId = model.statusId;
      taskModel.createdById = model.createdById;
      taskModel.dependentItemId = model.dependentItemId;
      taskModel.relatedItemId = model.relatedItemId;

      taskModel.estimatedTime = model.estimatedTime;
      taskModel.estimatedTimeReadable = model.estimatedTimeReadable;
      taskModel.remainingTime = model.remainingTime || 0;
      taskModel.overLoggedTime = model.overLoggedTime || 0;
      taskModel.totalLoggedTime = model.totalLoggedTime || 0;

      taskModel.projectId = model.projectId;
      taskModel.sprintId = taskDetails.sprintId;

      // check if task assignee id is available or not
      // if not then assign it to task creator
      taskModel.assigneeId = model.assigneeId || this._generalService.userId;
      isAssigneeChanged = taskDetails.assigneeId.toString() !== taskModel.assigneeId;

      // check if estimated time updated and one have already logged in this task
      if (taskModel.estimatedTimeReadable) {
        // estimate time is present then it should be in string parse it to seconds
        taskModel.estimatedTime = stringToSeconds(taskModel.estimatedTimeReadable);

        // ensure estimated time is changed
        if (taskModel.estimatedTime !== taskDetails.estimatedTime) {
          // check if task is in the sprint you can't update estimate
          if (taskDetails.sprintId) {
            BadRequest('Task is in sprint you can\'t update estimate time');
          }

          // if time is logged in this task then and then only re calculate task overall progress
          if (taskDetails.totalLoggedTime > 0) {
            // calculate task progress
            this._utilityService.calculateTaskProgress(taskDetails, taskDetails.totalLoggedTime, model.estimatedTime);
          }
        }
      }

      // model task-type and model display-name changed then re assign display-name with new task-type
      if (taskModel.taskTypeId !== taskDetails.taskTypeId.toString()) {
        const taskTypeDetails = await this._taskTypeService.getDetails(taskModel.projectId, taskModel.taskTypeId);

        // check if task type changed than update task display name
        const separateDisplayName = taskModel.displayName.split('-');
        const mainDisplayName = separateDisplayName[0];

        if (mainDisplayName.trim().toLowerCase() !== taskTypeDetails.name.toLowerCase()) {
          taskModel.displayName = `${taskTypeDetails.displayName}-${separateDisplayName[1]}`;
        }
      }

      taskModel.progress = model.progress || 0;
      taskModel.overProgress = model.overProgress || 0;
      taskModel.updatedById = this._generalService.userId;

      // check if tags is undefined assign blank array to that, this is the check for old data
      projectDetails.settings.tags = projectDetails.settings.tags ? projectDetails.settings.tags : [];

      // tags processing
      // if any new tag found that is not in projectDetails then need to add that in project

      const isNewTag = taskModel.tags.some(s => {
        return !(projectDetails.settings.tags.map(tag => tag.name).includes(s));
      });

      if (isNewTag) {
        const newTags = [...new Set([...taskModel.tags, ...projectDetails.settings.tags.map(tag => tag.name)])];

        // const newTags = xorWith(model.tags, projectDetails.settings.tags.map(m => m.name), isEqual);
        if (newTags.length) {
          projectDetails.settings.tags = newTags.map(tag => {
            return {
              name: tag,
              id: new Types.ObjectId().toHexString()
            };
          });

          await this._projectService.updateById(taskModel.projectId, {
            $set: { 'settings.tags': projectDetails.settings.tags }
          }, session);
        }
      }

      // check if task is in sprint
      if (taskDetails.sprintId) {
        const sprint = await this._sprintService.getSprintDetails(taskDetails.sprintId, taskDetails.projectId, []);

        // check if status is updated then update task position in sprint columns
        if (taskModel.statusId !== taskDetails.statusId) {
          // update task position in sprint columns
          await this.updateTaskStatusInSprint(sprint, taskDetails, taskModel.statusId, projectDetails, session);
        }

        // update sprint report
        await this._sprintReportService.updateReportTask(sprint.reportId, taskModel, session);
      }

      // update task by id
      await this.updateById(taskModel.id, taskModel, session);

      // create task history object
      // on the basis of task updated model
      const taskHistory = this.taskHistoryObjectHelper(isAssigneeChanged ? TaskHistoryActionEnum.assigneeChanged : TaskHistoryActionEnum.taskUpdated,
        taskModel.id, taskModel);

      // add task updated history
      await this._taskHistoryService.addHistory(taskHistory, session);
    });

    // get updated task details and return it
    try {
      const task: Task = await this._taskModel.findOne({ _id: taskModel.id }).populate(taskFullPopulation).select('-comments').lean().exec();

      // check if assignee changed than send mail to new assignee
      if (isAssigneeChanged) {
        this._utilityService.sendMailForTaskAssigned(task, projectDetails);
      }

      // send mail for task updated to all the task watchers
      this._utilityService.sendMailForTaskUpdated(task, projectDetails);
      return this._utilityService.prepareTaskVm(task);
    } catch (e) {
      throw e;
    }
  }

  /**
   * delete task
   * check if task is exist
   * task have sprintId and sprint is active then return error
   * @param model
   */
  async deleteTask(model: DeleteTaskModel) {
    if (!model.taskId) {
      throw new BadRequestException('Task not found');
    }

    await this._projectService.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.taskId, model.projectId);

    const session = await this.startSession();

    // check if task is in sprint
    if (taskDetails.sprintId) {
      const sprintDetails = await this._sprintService.getSprintDetails(taskDetails.sprintId, model.projectId, [], '');

      // if sprint found then check if sprint is active or not..
      if (sprintDetails) {
        if (sprintDetails.sprintStatus && sprintDetails.sprintStatus.status === SprintStatusEnum.inProgress) {
          throw new BadRequestException('Task is already added in sprint! Please delete from sprint first..');
        }
      }
    }


    try {
      await this.updateById(model.taskId, { isDeleted: true }, session);
      const taskHistory: TaskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskDeleted, model.taskId, taskDetails);
      await this._taskHistoryService.addHistory(taskHistory, session);
      await this.commitTransaction(session);
      return 'Task Deleted Successfully!';
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * get task by id or display name
   * @param model
   */
  async getTaskByIdOrDisplayName(model: GetTaskByIdOrDisplayNameModel) {
    await this._projectService.getProjectDetails(model.projectId);

    const queryObj = {};
    if (Types.ObjectId.isValid(model.taskId)) {
      queryObj['_id'] = model.taskId;
    } else {
      queryObj['displayName'] = { '$regex': new RegExp('^' + model.displayName.toLowerCase() + '$'), $options: 'i' };
    }
    queryObj['projectId'] = this.toObjectId(model.projectId);

    const task: Task = await this._taskModel.findOne(queryObj).populate(taskFullPopulation).select('-comments').lean().exec();
    if (!task) {
      throw new BadRequestException('Task not found');
    }
    return this._utilityService.prepareTaskVm(task);
  }

  /**
   * get tasks
   * @param model
   */
  async getTasks(model: TaskFilterModel) {
    try {
      // prepare filter from given model
      const queryFilter = this._utilityService.prepareFilterQuery(model);

      // check is valid key for sorting...
      if (model.sort) {
        model.sort = this._utilityService.validTaskSortingKey(model.sort);
      } else {
        model.sort = 'name';
        model.sortBy = 'asc';
      }

      // aggregate query for get all tasks
      const tasks = await this.dbModel
        .aggregate()
        .match(queryFilter)
        .lookup({
          from: DbCollection.users,
          let: { createdById: '$createdById' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$createdById'] } } },
            { $project: basicUserDetailsForAggregateQuery },
            { $addFields: { id: '$_id' } }
          ],
          as: 'createdBy'
        })
        .unwind({ path: '$createdBy', preserveNullAndEmptyArrays: true })
        .lookup({
          from: DbCollection.users,
          let: { updatedById: '$updatedById' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$updatedById'] } } },
            { $project: basicUserDetailsForAggregateQuery }
          ],
          as: 'updatedBy'
        })
        .unwind({ path: '$updatedBy', preserveNullAndEmptyArrays: true })
        .lookup({
          from: DbCollection.users,
          let: { assigneeId: '$assigneeId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$assigneeId'] } } },
            { $project: basicUserDetailsForAggregateQuery }
          ],
          as: 'assignee'
        })
        .unwind('assignee')
        .lookup({
          from: DbCollection.taskStatus,
          let: { statusId: '$statusId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$statusId'] } } },
            { $project: { name: 1 } }
          ],
          as: 'status'
        })
        .unwind({ path: '$status', preserveNullAndEmptyArrays: true })
        .lookup({
          from: DbCollection.taskPriority,
          let: { priorityId: '$priorityId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$priorityId'] } } },
            { $project: { name: 1, color: 1 } }
          ],
          as: 'priority'
        })
        .unwind({ path: '$priority', preserveNullAndEmptyArrays: true })
        .lookup({
          from: DbCollection.taskType,
          let: { taskTypeId: '$taskTypeId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$taskTypeId'] } } },
            { $project: { name: 1, color: 1 } }
          ],
          as: 'taskType'
        })
        .unwind('taskType')
        .addFields({ id: '$_id' })
        .project({
          watchers: 0,
          attachments: 0,
          comments: 0,
          isDeleted: 0,
          relatedItemId: 0,
          dependentItemId: 0,
          '__v': 0
        })
        .sort({ [model.sort]: model.sortBy === 'asc' ? 1 : -1 })
        .skip((model.count * model.page) - model.count)
        .limit(model.count);

      // query for all counting all matched tasks
      const countQuery = await this.dbModel.aggregate().match(queryFilter).count('totalRecords');
      let totalRecordsCount = 0;
      if (countQuery && countQuery[0]) {
        totalRecordsCount = countQuery[0].totalRecords;
      }

      // parse tasks to vm
      const parsedTasks = tasks.map(task => {
        return this._utilityService.prepareTaskVm(task);
      });

      // return paginated response
      return {
        page: model.page,
        totalItems: totalRecordsCount,
        totalPages: Math.ceil(totalRecordsCount / model.count),
        count: model.count,
        items: parsedTasks
      };
    } catch (e) {
      throw e;
    }
  }

  /**
   * get all back log tasks
   * @param model
   */
  async getAllBacklogs(model: TaskFilterModel) {
    try {
      if (!model || !model.projectId) {
        BadRequest('Project Not Found');
      }

      // project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);

      model = { ...new TaskFilterModel(model.projectId), ...model };

      // filter out last column status data as it is last status so filter them out
      if (projectDetails.activeBoard) {
        // check if have more than one columns
        if (projectDetails.activeBoard.columns.length > 1) {
          // get last column and last column status
          const lastStatusId = projectDetails.activeBoard.columns[projectDetails.activeBoard.columns.length - 1].headerStatusId;

          if (lastStatusId) {
            // filter out tasks with the last status id
            model.queries.push({
              key: 'statusId',
              value: [lastStatusId],
              condition: TaskFilterCondition.and,
              reverseFilter: true
            });
          }
        }
      }

      // query for task not in sprint , sprintId === undefined || sprintId === null
      model.queries.push({
        key: 'sprintId', value: [undefined, null], condition: TaskFilterCondition.and
      });

      return this.getTasks(model);
    } catch (e) {
      throw e;
    }
  }

  /**
   * get my tasks ( createdBy me or assigned to me )
   * @param model
   */
  async getMyTask(model: TaskFilterModel): Promise<BasePaginatedResponse<Task>> {
    if (!model || !model.projectId) {
      BadRequest('Project Not Found');
    }

    await this._projectService.getProjectDetails(model.projectId);

    model = { ...new TaskFilterModel(model.projectId), ...model };

    // set query for my tasks only
    model.queries.push({
      key: 'assigneeId', value: [toObjectId(this._generalService.userId)], condition: TaskFilterCondition.and
    });

    return this.getTasks(model);
  }

  /**
   * get task details by id
   * @param taskId
   * @param projectId
   * @param getFullDetails
   */
  async getTaskDetails(taskId: string, projectId: string, getFullDetails: boolean = false): Promise<Task> {
    if (!this.isValidObjectId(taskId)) {
      throw new BadRequestException('Task not found');
    }
    const taskDetails: Task = await this.findOne({
      filter: { _id: taskId, projectId },
      lean: true,
      populate: getFullDetails ? taskFullPopulation : []
    });

    if (!taskDetails) {
      throw new NotFoundException('Task not found');
    }
    taskDetails.id = taskDetails._id.toString();
    return taskDetails;
  }

  /**
   * update task status in sprint
   * update's task column in sprint columns using task status id
   * @param sprint
   * @param task
   * @param newStatusId
   * @param project
   * @param session
   */
  private async updateTaskStatusInSprint(sprint: Sprint, task: Task, newStatusId: string, project: Project, session: ClientSession) {

    const currentColumnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, task.statusId);
    // check if column exits in sprint
    if (currentColumnIndex === -1) {
      BadRequest('Task not found in sprint');
    }

    // get new column index where task is dropped
    const newColumnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, newStatusId);
    // check if new column exits in sprint
    if (newColumnIndex === -1) {
      BadRequest('Column not found where to move the task');
    }

    // get task from sprint column that's going to move to new column
    const oldSprintTask = sprint.columns[currentColumnIndex].tasks.find(
      sprintTask => sprintTask.taskId.toString() === task.id);

    // move task to new column and remove from old column
    sprint.columns = this._sprintUtilityService.moveTaskToNewColumn(sprint, task, oldSprintTask,
      this._generalService.userId, currentColumnIndex, newColumnIndex);

    // update sprint columns
    await this._sprintService.updateById(sprint.id, {
      $set: { 'columns': sprint.columns }
    }, session);
  }

  /**
   * create task history from given input
   * @param action : TaskHistoryActionEnum
   * @param taskId : string
   * @param task : Task
   */
  private taskHistoryObjectHelper(action: TaskHistoryActionEnum, taskId: string, task?: Task) {
    return {
      action, createdById: this._generalService.userId, taskId, task
    } as TaskHistory;
  }
}