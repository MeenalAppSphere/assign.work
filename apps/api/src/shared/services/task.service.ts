import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { DbCollection, Project, Task } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TaskService extends BaseService<Task & Document> {
  constructor(
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>
  ) {
    super(_taskModel);
  }

  async addTask(task: Task) {
    const session = await this._taskModel.db.startSession();
    session.startTransaction();

    const projectDetails = await this.getProjectDetails(task.project as string);
    try {
      const createdTask = await this.create([task], session);
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

  private async getProjectDetails(id: string): Promise<Project> {
    const projectDetails: Project = await this._projectModel.findById(id).lean().exec();
    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
    }
    return projectDetails;
  }

}
