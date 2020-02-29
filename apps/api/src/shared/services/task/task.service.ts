import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  BasePaginatedResponse,
  DbCollection,
  DeleteTaskModel,
  GetAllTaskRequestModel,
  GetMyTaskRequestModel,
  GetTaskByIdOrDisplayNameModel,
  SprintStatusEnum,
  Task,
  TaskFilterCondition,
  TaskFilterDto,
  TaskHistory,
  TaskHistoryActionEnum
} from '@aavantan-app/models';
import { ClientSession, Document, Model, Query, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskHistoryService } from '../task-history.service';
import { GeneralService } from '../general.service';
import { BadRequest, secondsToString, stringToSeconds } from '../../helpers/helpers';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';
import { SprintService } from '../sprint/sprint.service';
import { ModuleRef } from '@nestjs/core';
import { TaskTypeService } from '../task-type/task-type.service';
import { TaskPriorityService } from '../task-priority/task-priority.service';
import { TaskStatusService } from '../task-status/task-status.service';
import { ProjectService } from '../project/project.service';
import { TaskUtilityService } from './task.utility.service';
import { ProjectUtilityService } from '../project/project.utility.service';

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

@Injectable()
export class TaskService extends BaseService<Task & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _sprintService: SprintService;
  private _taskTypeService: TaskTypeService;
  private _taskPriorityService: TaskPriorityService;
  private _taskStatusService: TaskStatusService;
  private _taskHistoryService: TaskHistoryService;

  private _utilityService: TaskUtilityService;
  private _projectUtilityService: ProjectUtilityService;

  constructor(
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    private _generalService: GeneralService, private _moduleRef: ModuleRef
  ) {
    super(_taskModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
    this._sprintService = this._moduleRef.get('SprintService');
    this._taskTypeService = this._moduleRef.get('TaskTypeService');
    this._taskPriorityService = this._moduleRef.get('TaskPriorityService');
    this._taskStatusService = this._moduleRef.get('TaskStatusService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');

    this._utilityService = new TaskUtilityService();
    this._projectUtilityService = new ProjectUtilityService();
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
      return this.parseTaskObjectForUi(task);
    });

    return result;
  }

  /**
   * get my tasks
   * @param model
   */
  async getMyTask(model: GetMyTaskRequestModel): Promise<Partial<BasePaginatedResponse<Task>>> {
    return this.getAllTasks(model, true);
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
      }).populate(taskBasicPopulation).select('-comments').lean().exec();

      if (!task) {
        BadRequest('task not found');
      }

      // task is created now send all the mails
      this._utilityService.sendMailForTaskCreated(task, projectDetails);

      return this.parseTaskObjectForUi(task);
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
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);
    let isAssigneeChanged = false;

    // update task process
    await this.withRetrySession(async (session: ClientSession) => {
      if (!model || !model.id) {
        BadRequest('Task not found');
      }

      const taskDetails = await this.getTaskDetails(model.id, model.projectId);

      // check if task assignee id is available or not
      // if not then assign it to task creator
      model.assigneeId = model.assigneeId || this._generalService.userId;
      isAssigneeChanged = taskDetails.assigneeId.toString() !== model.assigneeId;

      // check if estimated time updated and one have already logged in this task
      if (model.estimatedTimeReadable) {
        // estimate time is present then it should be in string parse it to seconds
        model.estimatedTime = stringToSeconds(model.estimatedTimeReadable);

        // ensure estimated time is changed
        if (model.estimatedTime !== taskDetails.estimatedTime) {
          // check if task is in the sprint you can't update estimate
          if (taskDetails.sprintId) {
            throw new BadRequestException('task is in sprint you can\'t update estimate time');
          }

          // if time is logged in this task then and then only re calculate task overall progress
          if (taskDetails.totalLoggedTime > 0) {

            // calculate progress and over progress
            const progress: number = Number(((100 * taskDetails.totalLoggedTime) / model.estimatedTime).toFixed(DEFAULT_DECIMAL_PLACES));

            // if process is grater 100 then over time is added
            // in this case calculate overtime and set remaining time to 0
            if (progress > 100) {
              model.progress = 100;
              model.remainingTime = 0;
              model.overLoggedTime = taskDetails.totalLoggedTime - model.estimatedTime;

              const overProgress = Number(((100 * model.overLoggedTime) / model.estimatedTime).toFixed(DEFAULT_DECIMAL_PLACES));
              model.overProgress = overProgress > 100 ? 100 : overProgress;
            } else {
              // normal time logged
              // set overtime 0 and calculate remaining time
              model.progress = progress;
              model.remainingTime = model.estimatedTime - taskDetails.totalLoggedTime;
              model.overLoggedTime = 0;
              model.overProgress = 0;
            }
          }
        }
      }

      // model task-type and model display-name changed then re assign display-name with new task-type
      if (model.taskType && model.displayName) {
        const taskTypeDetails = await this._taskTypeService.getDetails(model.projectId, model.taskTypeId);

        // check if task type changed than update task display name
        const separateDisplayName = model.displayName.split('-');
        const mainDisplayName = separateDisplayName[0];

        if (mainDisplayName.trim().toLowerCase() !== taskTypeDetails.name.toLowerCase()) {
          model.displayName = `${taskTypeDetails.displayName}-${separateDisplayName[1]}`;
        }
      }

      model.progress = model.progress || 0;
      model.overProgress = model.overProgress || 0;
      model.updatedById = this._generalService.userId;

      // check if tags is undefined assign blank array to that, this is the check for old data
      projectDetails.settings.tags = projectDetails.settings.tags ? projectDetails.settings.tags : [];

      // tags processing
      // if any new tag found that is not in projectDetails then need to add that in project

      const isNewTag = model.tags.some(s => {
        return !(projectDetails.settings.tags.map(tag => tag.name).includes(s));
      });

      if (isNewTag) {
        const newTags = [...new Set([...model.tags, ...projectDetails.settings.tags.map(tag => tag.name)])];

        // const newTags = xorWith(model.tags, projectDetails.settings.tags.map(m => m.name), isEqual);
        if (newTags.length) {
          projectDetails.settings.tags = newTags.map(tag => {
            return {
              name: tag,
              id: new Types.ObjectId().toHexString()
            };
          });

          await this._projectService.updateById(model.projectId, {
            $set: { 'settings.tags': projectDetails.settings.tags }
          }, session);
        }
      }

      // create task history object
      const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskUpdated, model.id, model);

      // update task by id
      await this.updateById(model.id, model, session);

      // add comment updated history
      await this._taskHistoryService.addHistory(taskHistory, session);
    });

    // get updated task details and return it
    try {
      const task: Task = await this._taskModel.findOne({ _id: model.id }).populate(taskBasicPopulation).select('-comments').lean().exec();

      // check if assignee changed than send mail to new assignee
      if (isAssigneeChanged) {
        this._utilityService.sendMailForTaskAssigned(task, projectDetails);
      }

      // send mail for task updated to all the task watchers
      this._utilityService.sendMailForTaskUpdated(task, projectDetails);
      return this.parseTaskObjectForUi(task);
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

    const task: Task = await this._taskModel.findOne(queryObj).populate(taskBasicPopulation).select('-comments').lean().exec();
    if (!task) {
      throw new BadRequestException('task not found');
    }
    return this.parseTaskObjectForUi(task);
  }

  /**
   * get tasks
   * @param model
   */
  async getTasks(model: TaskFilterDto) {
    const query = this.prepareFilterQuery(model);
    query.populate(taskBasicPopulation);
    return this._taskModel.find(query);
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
      populate: getFullDetails ? taskBasicPopulation : []
    });

    if (!taskDetails) {
      throw new NotFoundException('Task not found');
    }
    taskDetails.id = taskDetails._id.toString();
    return taskDetails;
  }

  /**
   * common update method for updating task
   * @param id: task id
   * @param task: task model
   * @param history: history object
   * @param sessionObj: session for transaction
   */
  private async updateHelper(id: string, task: any, history: TaskHistory, sessionObj?: ClientSession): Promise<string> {

    if (!id) {
      throw new BadRequestException('invalid request');
    }

    let session;
    if (sessionObj) {
      session = sessionObj;
    } else {
      session = await this._taskModel.db.startSession();
      session.startTransaction();
    }

    try {
      await this.updateById(id, task, session);
      await this._taskHistoryService.addHistory(history, session);
      await session.commitTransaction();
      session.endSession();
      return task.id;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
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

  /**
   * prepare filter query for task filtering
   * @param model : TaskFilterDto
   */
  private prepareFilterQuery(model: TaskFilterDto) {
    const filterQuery = new Query();

    const filter: any = {
      $and: [{
        projectId: model.projectId
      }, {
        $or: [{
          name: { $regex: new RegExp(model.term.toString()), $options: 'i' }
        },
          {
            displayName: { $regex: new RegExp(model.term.toString()), $options: 'i' }
          },
          {
            description: { $regex: new RegExp(model.term.toString()), $options: 'gi' }
          },
          {
            tags: { $regex: new RegExp(model.term.toString()), $options: 'i' }
          }]
      }]
    };

    if (model.queries && model.queries.length) {
      model.queries.forEach(query => {
        if (query.condition === TaskFilterCondition.and) {
          filter.$and.push(
            { [query.key]: { $in: query.value } }
          );
        } else {
          filter.$and.push({
            $or: [{ [query.key]: { $in: query.value } }]
          });
        }
      });
    }
    // const keys = Object.keys(model);
    //
    // keys.filter(key => {
    //   // and should be used for all the referenced columns
    //   if (objectIds.includes(key)) {
    //     if (Array.isArray(model[key])) {
    //       filter.$and.push({ [key]: { $in: model[key] } });
    //     } else {
    //       filter.$and.push({ [key]: model[key] });
    //     }
    //   } else {
    //     // or for or text related searches
    //     if (Array.isArray(model[key])) {
    //       filter.$or.push({ [key]: { $regex: new RegExp(model[key].join(' ')), $options: 'i' } });
    //     } else {
    //       filter.$or.push({ [key]: { $regex: new RegExp(model[key].toString()), $options: 'i' } });
    //     }
    //   }
    // });
    //
    // if (!filter.$or.length) {
    //   delete filter.$or;
    // }

    console.log(filter);

    filterQuery.setQuery(filter);
    // if (model.sort) {
    //   query.sort({ [model.sort]: model.sortBy === 'asc' ? 1 : -1 });
    // }

    return filterQuery.lean();
  }

  /**
   * parse task object, convert seconds to readable string, fill task type, priority, status etc..
   * @param task : Task
   */
  private parseTaskObjectForUi(task: Task) {
    task.id = task['_id'];

    if (task.taskType) {
      task.taskType.id = task.taskType._id;
    }

    if (task.status) {
      task.status.id = task.status._id;
    }

    if (task.priority) {
      task.priority.id = task.priority._id;
    }

    // task.taskType = projectDetails.settings.taskTypes.find(t => t.id === task.taskType);
    // task.priority = projectDetails.settings.priorities.find(t => t.id === task.priority);
    // task.status = projectDetails.settings.status.find(t => t.id === task.status);
    task.isSelected = !!task.sprintId;

    // convert all time keys to string from seconds
    task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime || 0);
    task.estimatedTimeReadable = secondsToString(task.estimatedTime || 0);
    task.remainingTimeReadable = secondsToString(task.remainingTime || 0);
    task.overLoggedTimeReadable = secondsToString(task.overLoggedTime || 0);

    if (task.attachmentsDetails) {
      task.attachmentsDetails.forEach(attachment => {
        attachment.id = attachment['_id'];
      });
    }
    return task;
  }

}
