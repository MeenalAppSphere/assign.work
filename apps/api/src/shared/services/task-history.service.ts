import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { DbCollection, GetTaskHistoryModel, Project, Task, TaskHistory, User } from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';

@Injectable()
export class TaskHistoryService extends BaseService<TaskHistory & Document> {
  constructor(
    @InjectModel(DbCollection.taskHistory) protected readonly _taskHistoryModel: Model<TaskHistory & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private readonly _generalService: GeneralService
  ) {
    super(_taskHistoryModel);
  }

  async addHistory(model: TaskHistory, session: ClientSession) {
    try {
      return await this.create([model], session);
    } catch (e) {
      await session.abortTransaction();
      await session.endSession();
      throw e;
    }
  }

  async getTaskHistory(model: GetTaskHistoryModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);

    return await this.getAllPaginatedData({ taskId: model.taskId }, model);
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

  // private async getTaskDetails(id: string): Promise<Task> {
  //   const taskDetails: Task = await this._taskModel.findById(id).lean().exec();
  //
  //   if (!taskDetails) {
  //     throw new NotFoundException('No Task Found');
  //   }
  //   return taskDetails;
  // }
}
