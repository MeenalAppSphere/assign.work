import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  DbCollection,
  Project,
  Task,
  TaskComments,
  TaskFilterDto,
  TaskHistory,
  TaskHistoryActionEnum
} from '@aavantan-app/models';
import { Document, Model, Query, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskHistoryService } from './task-history.service';

@Injectable()
export class TaskService extends BaseService<Task & Document> {
  constructor(
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private _taskHistoryService: TaskHistoryService
  ) {
    super(_taskModel);
  }

  async getAllTasks(filter: any = {}, populate: Array<any> = []): Promise<Partial<Task[]>> {
    let allTasks: Task[] = await this.getAll(filter, populate);

    allTasks = allTasks.map(task => {
      task.id = task['_id'];
      task.taskType = task.project.settings.taskTypes.find(t => t.id === task.taskType);
      task.priority = task.project.settings.priorities.find(t => t.id === task.priority);
      return task;
    });

    allTasks.forEach(task => {
      delete task['project']['settings'];
    });

    return allTasks;
  }

  async addTask(task: Task): Promise<Task> {
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    const projectDetails = await this.getProjectDetails(task.projectId);

    // validation
    if (!task.taskType) {
      throw new BadRequestException('Please add Task Type');
    }

    const lastTask = await this._taskModel.find({}).sort({ _id: -1 }).limit(1).select('_id, displayName').lean();

    const taskTypeDetails = projectDetails.settings.taskTypes.find(f => f.id === task.taskType);

    if (!taskTypeDetails) {
      throw new BadRequestException('Please create Task Type');
    }

    if (lastTask[0]) {
      // tslint:disable-next-line:radix
      const lastInsertedNo = parseInt(lastTask[0].displayName.split('-')[1]);
      task.displayName = `${taskTypeDetails.displayName}-${lastInsertedNo + 1}`;
    } else {
      task.displayName = `${taskTypeDetails.displayName}-1`;
    }

    try {
      const createdTask = await this.create([task], session);
      const taskHistory: TaskHistory = this.taskHistoryObjectHelper(TaskHistoryActionEnum.taskCreated, task.createdById, createdTask[0].id);
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

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    await this.updateHelper(id, task, null);
    return this._taskModel.findById(id).lean();
  }

  async deleteTask(id: string) {
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    try {
      await this.delete(id);
      await session.commitTransaction();
      session.endSession();
      return 'Task Deleted Successfully!';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async getTaskByIdOrDisplayName(q: string, populate: Array<any> = []) {
    const queryObj = {};
    if (Types.ObjectId.isValid(q)) {
      queryObj['_id'] = q;
    } else {
      queryObj['displayName'] = q;
    }
    const task: Task = await this._taskModel.findOne(queryObj).populate(populate).select('-comments').lean().exec();
    task.id = task['_id'];
    task.taskType = task.project.settings.taskTypes.find(t => t.id === task.taskType);
    task.priority = task.project.settings.priorities.find(t => t.id === task.priority);
    delete task['project']['settings'];
    return task;
  }

  async getTasks(model: TaskFilterDto, populate: Array<any> = []) {
    const query = this.prepareFilterQuery(model);
    query.populate(populate);
    return this._taskModel.find(query);
  }

  async getComments(id: string): Promise<TaskComments[]> {
    return await this._taskModel.findById(id).select('comments -_id').populate('comments.attachmentsDetails').lean().exec();
  }

  async addComment(id: string, comment: TaskComments): Promise<string> {
    const taskDetails = await this.getTaskDetails(id);

    comment.id = new Types.ObjectId().toHexString();
    comment.createdAt = new Date();
    comment.isPinned = false;

    if (!taskDetails.comments.length) {
      taskDetails.comments = [comment];
    } else {
      taskDetails.comments.push(comment);
    }
    await this.updateHelper(id, taskDetails, TaskHistoryActionEnum.commentAdded);
    return 'Comment Added Successfully';
  }

  async updateComment(id: string, comment: TaskComments): Promise<string> {
    const taskDetails = await this.getTaskDetails(id);

    taskDetails.comments = taskDetails.comments.map(com => {
      if (com.id === comment.id) {
        return comment;
      }
      return com;
    });

    await this.updateHelper(id, taskDetails, TaskHistoryActionEnum.commentUpdated);
    return 'Comment Updated Successfully';
  }

  async pinComment(id: string, commentId: string, isPinned: boolean): Promise<string> {
    const taskDetails = await this.getTaskDetails(id);

    taskDetails.comments = taskDetails.comments.map(com => {
      if (com.id === commentId) {
        com.isPinned = isPinned;
      }
      return com;
    });

    await this.updateHelper(id, taskDetails, TaskHistoryActionEnum.commentPinned);
    return `Comment ${isPinned ? 'Pinned' : 'Un Pinned'} Successfully`;
  }

  private async getProjectDetails(id: string): Promise<Project> {
    const projectDetails: Project = await this._projectModel.findById(id).lean().exec();
    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
    }
    return projectDetails;
  }

  private async getTaskDetails(id: string): Promise<Task> {
    const taskDetails: Task = await this._taskModel.findById(id).lean().exec();

    if (!taskDetails) {
      throw new NotFoundException('No Project Found');
    }
    return taskDetails;
  }

  private async updateHelper(id: string, task: Partial<Task>, action: TaskHistoryActionEnum): Promise<string> {
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    try {
      await this.update(id, task, session);
      const taskHistory: TaskHistory = this.taskHistoryObjectHelper(action, task.createdById, id);
      await this._taskHistoryService.addHistory(taskHistory, session);
      await session.commitTransaction();
      session.endSession();
      return id;
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
