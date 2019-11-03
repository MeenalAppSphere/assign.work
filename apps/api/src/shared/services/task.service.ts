import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AttachmentModel,
  DbCollection,
  Project,
  Task,
  TaskComments,
  TaskHistory,
  TaskType
} from '@aavantan-app/models';
import { Document, Model, Types } from 'mongoose';
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

  async addTask(task: Task) {
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    const projectDetails = await this.getProjectDetails(task.project as string);

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
      const taskHistory: TaskHistory = {
        action: 'Task Added',
        createdBy: task.createdBy,
        task: createdTask[0].id
      };
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

  async updateTask(id: string, task: Partial<Task>) {
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    try {
      await this.update(id, task, session);
      await session.commitTransaction();
      session.endSession();
      return await this.findById(id);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
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

  async addComment(id: string, comment: TaskComments) {
    const taskDetails = await this.getTaskDetails(id);

    comment.id = new Types.ObjectId().toHexString();
    if (!taskDetails.comments.length) {
      taskDetails.comments = [comment];
    } else {
      taskDetails.comments.push(comment);
    }
    return this.updateTask(id, taskDetails);
  }

  async updateComment(id: string, comment: TaskComments) {
    const taskDetails = await this.getTaskDetails(id);

    taskDetails.comments = taskDetails.comments.map(com => {
      if (com.id === comment.id) {
        return comment;
      }
      return com;
    });

    return this.updateTask(id, taskDetails);
  }

  async pinComment(id: string, commentId: string, isPinned: boolean) {
    const taskDetails = await this.getTaskDetails(id);

    taskDetails.comments = taskDetails.comments.map(com => {
      if (com.id === commentId) {
        com.isPinned = isPinned;
      }
      return com;
    });

    return this.updateTask(id, taskDetails);
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

}
