import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddCommentModel,
  BasePaginatedResponse,
  CommentPinModel,
  DbCollection,
  DeleteCommentModel,
  GetAllTaskRequestModel,
  GetCommentsModel,
  GetMyTaskRequestModel,
  GetTaskByIdOrDisplayNameModel,
  Project,
  Task,
  TaskComments,
  TaskFilterDto,
  TaskHistory,
  TaskHistoryActionEnum,
  UpdateCommentModel,
  User
} from '@aavantan-app/models';
import { ClientSession, Document, Model, Query, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskHistoryService } from './task-history.service';
import { GeneralService } from './general.service';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { secondsToString, stringToSeconds } from '../helpers/helpers';

/**
 * common task population object
 */
const taskBasicPopulation: any[] = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'assignee',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'watchersDetails',
  select: 'emailId userName firstName lastName profilePic -_id'
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
}];

@Injectable()
export class TaskService extends BaseService<Task & Document> {
  constructor(
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private _taskHistoryService: TaskHistoryService, private _generalService: GeneralService
  ) {
    super(_taskModel);
  }

  /**
   * get all tasks
   * @param model : request model includes project id and filter params
   * @param onlyMyTask: show only my task
   */
  async getAllTasks(model: GetAllTaskRequestModel, onlyMyTask: boolean = false): Promise<Partial<BasePaginatedResponse<Task>>> {
    const projectDetails = await this.getProjectDetails(model.projectId);

    // set populate fields
    model.populate = [{
      path: 'createdBy',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }, {
      path: 'assignee',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }];

    // set selection fields
    model.select = '_id name taskType priority status createdById assigneeId progress overProgress totalLoggedTime estimatedTime remainingTime overLoggedTime displayName';

    let filter = {};
    if (onlyMyTask) {
      filter = {
        projectId: model.projectId,
        $or: [{ assigneeId: this._generalService.userId }, { createdById: this._generalService.userId }]
      };
    } else {
      filter = { projectId: model.projectId };
    }

    const result: BasePaginatedResponse<Task> = await this.getAllPaginatedData(filter, model);

    result.items = result.items.map(task => {
      return this.parseTaskObjectForUi(task, projectDetails);
    });

    return result;
  }

  async getMyTask(model: GetMyTaskRequestModel): Promise<Partial<BasePaginatedResponse<Task>>> {
    return this.getAllTasks(model, true);
  }

  /**
   * add task service accept a single parameter task object
   * @param model: Task
   */
  async addTask(model: Task): Promise<Task> {
    const projectDetails = await this.getProjectDetails(model.projectId);

    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    // validation
    if (!model || !model.taskType) {
      throw new BadRequestException('Please add Task Type');
    }

    const lastTask = await this._taskModel.find({
      projectId: model.projectId
    }).sort({ _id: -1 }).limit(1).select('_id, displayName').lean();

    const taskTypeDetails = projectDetails.settings.taskTypes.find(f => f.id === model.taskType);

    if (!taskTypeDetails) {
      throw new BadRequestException('Task Type not found');
    }

    try {
      // display name processing
      if (lastTask[0]) {
        // tslint:disable-next-line:radix
        const lastInsertedNo = parseInt(lastTask[0].displayName.split('-')[1]);
        model.displayName = `${taskTypeDetails.displayName}-${lastInsertedNo + 1}`;
      } else {
        model.displayName = `${taskTypeDetails.displayName}-1`;
      }

      // check if watchers added or not if not then assign blank array
      model.watchers = model.watchers || [];

      // add task creator and assignee as default watcher
      model.watchers = [
        ...new Set([
          this._generalService.userId,
          model.assigneeId ? model.assigneeId : '',
          ...model.watchers
        ])
      ].filter(watcher => watcher);

      // check if tags is undefined assign blank array to that, this is the check for old data
      projectDetails.settings.tags = projectDetails.settings.tags ? projectDetails.settings.tags : [];

      // tags processing
      // if any tag found that is not in projectDetails then need to add that in project
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

          await this._projectModel.updateOne({ _id: this.toObjectId(model.projectId) }, {
            $set: { 'settings.tags': projectDetails.settings.tags }
          }, session);
        }
      }

      const createdTask = await this.create([model], session);
      const taskHistory: TaskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskCreated, createdTask[0].id, createdTask[0]);
      await this._taskHistoryService.addHistory(taskHistory, session);
      await session.commitTransaction();
      session.endSession();
      return createdTask[0];
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
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
      throw new BadRequestException();
    }

    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.id);

    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    // check if estimated time updated and one have already logged in this task
    if (model.estimatedTimeReadable) {
      // estimate time is present then it should be in string parse it to seconds
      model.estimatedTime = stringToSeconds(model.estimatedTimeReadable);

      // check if task is in the sprint you can't update estimate
      if (taskDetails.sprintId) {
        throw new BadRequestException('task is in sprint you can\'t update estimate time');
      }

      // if time is logged in this task then and then only re calculate task overall progress
      if (taskDetails.totalLoggedTime > 0) {

        // ensure estimated time is changed
        if (model.estimatedTime !== taskDetails.estimatedTime) {
          // calculate progress and over progress
          const progress: number = Number(((100 * taskDetails.totalLoggedTime) / model.estimatedTime).toFixed(2));

          // if process is grater 100 then over time is added
          // in this case calculate overtime and set remaining time to 0
          if (progress > 100) {
            model.progress = 100;
            model.remainingTime = 0;
            model.overLoggedTime = taskDetails.totalLoggedTime - model.estimatedTime;

            const overProgress = Number(((100 * model.overLoggedTime) / model.estimatedTime).toFixed(2));
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
      const taskTypeDetails = projectDetails.settings.taskTypes.find(f => f.id === model.taskType);

      // check if task type changed than update task display name
      const separateDisplayName = model.displayName.split('-');
      const mainDisplayName = separateDisplayName[0];

      if (mainDisplayName.trim().toLowerCase() !== taskTypeDetails.name.toLowerCase()) {
        model.displayName = `${taskTypeDetails.name}-${separateDisplayName[1]}`;
      }
    }

    model.progress = model.progress || 0;
    model.overProgress = model.overProgress || 0;

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

        await this._projectModel.updateOne({ _id: this.toObjectId(model.projectId) }, {
          $set: { 'settings.tags': projectDetails.settings.tags }
        }, session);
      }
    }

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskUpdated, model.id, model);
    await this.updateHelper(model.id, model, taskHistory, session);

    const task: Task = await this._taskModel.findOne({ _id: model.id }).populate(taskBasicPopulation).select('-comments').lean().exec();
    return this.parseTaskObjectForUi(task, projectDetails);
  }

  async deleteTask(model: DeleteCommentModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    try {
      await this.delete(model.taskId);
      await session.commitTransaction();
      session.endSession();
      return 'Task Deleted Successfully!';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async getTaskByIdOrDisplayName(model: GetTaskByIdOrDisplayNameModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);

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
    return this.parseTaskObjectForUi(task, projectDetails);
  }

  async getTasks(model: TaskFilterDto) {
    const query = this.prepareFilterQuery(model);
    query.populate(taskBasicPopulation);
    return this._taskModel.find(query);
  }

  async getComments(model: GetCommentsModel): Promise<TaskComments[]> {
    const projectDetails = await this.getProjectDetails(model.projectId);

    const data = await this._taskModel.findById(model.taskId).select('comments -_id').populate([{
      path: 'comments.createdBy',
      select: '-_id firstName lastName profilePic',
      justOne: true
    }, {
      path: 'comments.attachments'
    }]).lean().exec();

    if (data) {
      return orderBy(data.comments.map(c => {
        c.id = c['_id'];
        return c;
      }), (cmnt) => {
        return moment(cmnt.updatedAt).toDate();
      }, 'desc');
    } else {
      throw new NotFoundException('Task Not Found');
    }
  }

  async addComment(model: AddCommentModel): Promise<string> {

    if (!model || !model.comment) {
      throw new BadRequestException('please add comment');
    }

    const projectDetails = await this.getProjectDetails(model.projectId);

    const taskDetails = await this.getTaskDetails(model.taskId);

    model.comment.createdById = this._generalService.userId;
    model.comment.createdAt = new Date();

    if (!taskDetails.comments.length) {
      taskDetails.comments = [model.comment];
    } else {
      taskDetails.comments.push(model.comment);
    }
    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentAdded, model.taskId, taskDetails);
    await this.updateHelper(model.taskId, taskDetails, taskHistory);
    return 'Comment Added Successfully';
  }

  /**
   * update comment
   * @param model: UpdateCommentModel
   */
  async updateComment(model: UpdateCommentModel): Promise<string> {
    if (!model || !model.comment) {
      throw new BadRequestException('please add comment');
    }

    if (!model.comment.id) {
      throw new BadRequestException('invalid request');
    }

    const projectDetails = await this.getProjectDetails(model.projectId);

    const taskDetails = await this.getTaskDetails(model.taskId);

    // find comment and update it
    taskDetails.comments = taskDetails.comments.map(com => {
      if (com['_id'].toString() === model.comment.id) {
        return {
          ...com,
          ...model.comment,
          updatedAt: new Date()
        };
      }
      return com;
    });

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentUpdated, model.taskId, taskDetails);
    await this.updateHelper(model.taskId, taskDetails, taskHistory);
    return 'Comment Updated Successfully';
  }

  async pinComment(model: CommentPinModel): Promise<string> {
    if (!model || !model.commentId) {
      throw new BadRequestException('invalid request');
    }
    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.taskId);

    taskDetails.comments = taskDetails.comments.map(com => {
      if (com['_id'].toString() === model.commentId) {
        com.updatedAt = new Date();
        com.isPinned = model.isPinned;
      }
      return com;
    });

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentPinned, model.taskId, taskDetails);
    await this.updateHelper(model.taskId, taskDetails, taskHistory);
    return `Comment ${model.isPinned ? 'Pinned' : 'Un Pinned'} Successfully`;
  }

  async deleteComment(model: DeleteCommentModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.taskId);

    taskDetails.comments = taskDetails.comments.filter(com => {
      return com.id !== model.commentId;
    });

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentDeleted, model.taskId, taskDetails);
    await this.updateHelper(model.taskId, taskDetails, taskHistory);
    return `Comment Deleted Successfully`;
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
   * @param id: task id
   */
  private async getTaskDetails(id: string): Promise<Task> {
    const taskDetails: Task = await this._taskModel.findById(id).lean().exec();

    if (!taskDetails) {
      throw new NotFoundException('No Task Found');
    }
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
      await this.update(id, task, session);
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
    const query = new Query();
    const otherKeys: Array<{ key: string, value: string }> = [];
    const filter = {
      $or: []
    };

    Object.keys(model).forEach(key => {
      if (Array.isArray(model[key])) {
        filter.$or.push({ [key]: { $regex: new RegExp(model[key].join(' ')), $options: 'i' } });
      } else {
        filter.$or.push({ [key]: { $regex: new RegExp(model[key]), $options: 'i' } });
      }
    });

    query.setQuery(filter);
    if (model.sort) {
      query.sort({ [model.sort]: model.sortBy === 'asc' ? 1 : -1 });
    }

    return query.lean();
  }

  /**
   * parse task object, convert seconds to readable string, fill task type, priority, status etc..
   * @param task : Task
   * @param projectDetails: Project
   */
  private parseTaskObjectForUi(task: Task, projectDetails: Project) {
    task.id = task['_id'];

    task.taskType = projectDetails.settings.taskTypes.find(t => t.id === task.taskType);
    task.priority = projectDetails.settings.priorities.find(t => t.id === task.priority);
    task.status = projectDetails.settings.status.find(t => t.id === task.status);

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
