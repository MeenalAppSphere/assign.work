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
import { Document, Model, Query, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskHistoryService } from './task-history.service';
import { GeneralService } from './general.service';

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
    if (!model.taskType) {
      throw new BadRequestException('Please add Task Type');
    }

    const lastTask = await this._taskModel.find({}).sort({ _id: -1 }).limit(1).select('_id, displayName').lean();

    const taskTypeDetails = projectDetails.settings.taskTypes.find(f => f.id === model.taskType);

    if (!taskTypeDetails) {
      throw new BadRequestException('Please create Task Type');
    }

    if (lastTask[0]) {
      // tslint:disable-next-line:radix
      const lastInsertedNo = parseInt(lastTask[0].displayName.split('-')[1]);
      model.displayName = `${taskTypeDetails.displayName}-${lastInsertedNo + 1}`;
    } else {
      model.displayName = `${taskTypeDetails.displayName}-1`;
    }

    try {
      const createdTask = await this.create([model], session);
      const taskHistory: TaskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskCreated, model.createdById, createdTask[0].id);
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
    const projectDetails = await this.getProjectDetails(model.projectId);

    await this.updateHelper(model.id, model, null);
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
    // delete task['project']['settings'];
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
      return data.comments.map(c => {
        c.id = c['_id'];
        return c;
      });
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
    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentAdded, this._generalService.userId, model.taskId);
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
    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentUpdated, this._generalService.userId, model.taskId);
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

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentPinned, this._generalService.userId, model.taskId);
    await this.updateHelper(model.taskId, taskDetails, taskHistory);
    return `Comment ${model.isPinned ? 'Pinned' : 'Un Pinned'} Successfully`;
  }

  async deleteComment(model: DeleteCommentModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);
    const taskDetails = await this.getTaskDetails(model.taskId);

    taskDetails.comments = taskDetails.comments.filter(com => {
      return com.id !== model.commentId;
    });

    const taskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.commentDeleted, this._generalService.userId, model.taskId);
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

  private async updateHelper(id: string, task: Partial<Task>, history: TaskHistory): Promise<string> {

    if (!id) {
      throw new BadRequestException('invalid request');
    }

    const session = await this._taskModel.db.startSession();
    session.startTransaction();

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

  private taskHistoryObjectHelper(action: TaskHistoryActionEnum, createdById: string, taskId: string) {
    return {
      action, createdById, taskId
    } as TaskHistory;
  }

  private prepareFilterQuery(model: TaskFilterDto) {
    const query = new Query();
    const otherKeys: Array<{ key: string, value: string }> = [];

    Object.keys(model).forEach(key => {
      if (['taskTypeId', ''].includes(key)) {

      }
      if (Array.isArray(model[key])) {
        query.setQuery({ [key]: { $regex: new RegExp(model[key].join(' ')), $options: 'i' } });
      } else {
        query.setQuery({ [key]: { $regex: new RegExp(model[key]), $options: 'i' } });
      }
    });

    return query.lean();
  }

}
