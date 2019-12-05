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
  ProjectTags,
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
import { isEqual, orderBy, uniqWith, xor, xorWith } from 'lodash';
import * as moment from 'moment';
import { stringToSeconds } from '../helpers/helpers';

@Injectable()
export class TaskService extends BaseService<Task & Document> {
  constructor(
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private _taskHistoryService: TaskHistoryService, private _generalService: GeneralService
  ) {
    super(_taskModel);
  }

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
    model.select = '_id name taskType priority status createdById assigneeId progress totalLoggedTime estimatedTime remainingTime displayName';

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
      task.id = task['_id'];
      task.taskType = projectDetails.settings.taskTypes.find(t => t.id === task.taskType);
      task.priority = projectDetails.settings.priorities.find(t => t.id === task.priority);
      task.status = projectDetails.settings.status.find(t => t.id === task.status);
      return task;
    });

    // allTasks.forEach(task => {
    //   delete task['project']['settings'];
    // });

    return result;
  }

  async getMyTask(model: GetMyTaskRequestModel): Promise<Partial<BasePaginatedResponse<Task>>> {
    return this.getAllTasks(model, true);
  }

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

      // check if tags is undefined assign blank array to that, this is the check for old data
      projectDetails.settings.tags = projectDetails.settings.tags ? projectDetails.settings.tags : [];

      // tags processing
      // if any tag found that is not in projectDetails then need to add that in project
      const newTags = xorWith(model.tags, projectDetails.settings.tags.map(m => m.name), isEqual);

      if (newTags.length) {

        const tagsModel: ProjectTags[] = newTags.map(tag => {
          return {
            name: tag,
            id: new Types.ObjectId().toHexString()
          };
        });

        projectDetails.settings.tags.push(...tagsModel);

        await this._projectModel.updateOne({ _id: this.toObjectId(model.projectId) }, {
          $set: { 'settings.tags': projectDetails.settings.tags }
        }, session);

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

  async updateTask(model: Task): Promise<Task> {
    if (!model) {
      throw new BadRequestException();
    }

    const projectDetails = await this.getProjectDetails(model.projectId);

    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    // estimate time is present then it should be in string parse it to seconds
    if (model.estimatedTimeReadable) {
      model.estimatedTime = stringToSeconds(model.estimatedTimeReadable);
    }

    // model task-type and model display-name changed then re assign display-name with new task-type
    if (model.taskType && model.displayName) {
      const taskTypeDetails = projectDetails.settings.taskTypes.find(f => f.id === model.taskType);

      // check if task type changed than update task display name
      const separateDisplayName = model.displayName.split('-');
      const mainDisplayName = separateDisplayName[0];

      if (mainDisplayName.trim().toLowerCase() !== taskTypeDetails.name) {
        model.displayName = `${taskTypeDetails.name}-${separateDisplayName[1]}`;
      }
    }

    // check if tags is undefined assign blank array to that, this is the check for old data
    projectDetails.settings.tags = projectDetails.settings.tags ? projectDetails.settings.tags : [];

    // tags processing
    // if any tag found that is not in projectDetails then need to add that in project
    const newTags = xorWith(model.tags, projectDetails.settings.tags.map(m => m.name), isEqual);
    if (newTags.length) {
      const tagsModel: ProjectTags[] = newTags.map(tag => {
        return {
          name: tag,
          id: new Types.ObjectId().toHexString()
        };
      });

      projectDetails.settings.tags.push(...tagsModel);

      await this._projectModel.updateOne({ _id: this.toObjectId(model.projectId) }, {
        $set: { 'settings.tags': projectDetails.settings.tags }
      }, session);
    }

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskUpdated, model.id, model);
    await this.updateHelper(model.id, model, taskHistory, session);
    return this._taskModel.findById(model.id).lean();
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

  async getTaskByIdOrDisplayName(model: GetTaskByIdOrDisplayNameModel, populate: Array<any> = []) {
    const projectDetails = await this.getProjectDetails(model.projectId);

    const queryObj = {};
    if (Types.ObjectId.isValid(model.taskId)) {
      queryObj['_id'] = model.taskId;
    } else {
      queryObj['displayName'] = model.displayName;
    }
    const task: Task = await this._taskModel.findOne(queryObj).populate(populate).select('-comments').lean().exec();
    task.id = task['_id'];

    task.taskType = projectDetails.settings.taskTypes.find(t => t.id === task.taskType);
    task.priority = projectDetails.settings.priorities.find(t => t.id === task.priority);
    task.status = projectDetails.settings.status.find(t => t.id === task.status);

    task.attachmentsDetails.forEach(attachment => {
      attachment.id = attachment['_id'];
    });
    return task;
  }

  async getTasks(model: TaskFilterDto, populate: Array<any> = []) {
    const query = this.prepareFilterQuery(model);
    query.populate(populate);
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

  async updateComment(model: UpdateCommentModel): Promise<string> {
    const projectDetails = await this.getProjectDetails(model.projectId);

    const taskDetails = await this.getTaskDetails(model.taskId);

    taskDetails.comments = taskDetails.comments.map(com => {
      if (com.id === model.comment.id) {
        model.comment.updatedAt = new Date();
        return model.comment;
      }
      return com;
    });
    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentUpdated, model.taskId, taskDetails);
    await this.updateHelper(model.taskId, taskDetails, taskHistory);
    return 'Comment Updated Successfully';
  }

  async pinComment(model: CommentPinModel): Promise<string> {
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
    const taskDetails: Task = await this._taskModel.findById(id).lean().exec();

    if (!taskDetails) {
      throw new NotFoundException('No Task Found');
    }
    return taskDetails;
  }

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

  // tslint:disable-next-line:no-shadowed-variable
  private taskHistoryObjectHelper(action: TaskHistoryActionEnum, taskId: string, task?: Task) {
    return {
      action, createdById: this._generalService.userId, taskId, task
    } as TaskHistory;
  }

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

}
