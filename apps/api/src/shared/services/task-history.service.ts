import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  BasePaginatedResponse,
  DbCollection,
  GetTaskHistoryModel,
  Project,
  TaskHistory, TaskHistoryActionEnum,
  User,
  Task
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import { generateUtcDate } from '../helpers/helpers';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from './project/project.service';

@Injectable()
export class TaskHistoryService extends BaseService<TaskHistory & Document> implements OnModuleInit {
  public _projectService: ProjectService;

  constructor(
    @InjectModel(DbCollection.taskHistory) protected readonly _taskHistoryModel: Model<TaskHistory & Document>,
    private readonly _generalService: GeneralService, private _moduleRef: ModuleRef
  ) {
    super(_taskHistoryModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
  }

  /**
   * create and return task history object on basis of given input
   * @param action
   * @param taskId
   * @param task
   * @param sprintId
   */
  createHistoryObject(action: TaskHistoryActionEnum, taskId: string, task: Task, sprintId?: string): TaskHistory {
    const history = new TaskHistory();

    history.action = action;
    history.taskId = taskId;
    history.sprintId = sprintId ? sprintId : null;
    history.desc = action;
    history.createdAt = generateUtcDate();
    history.createdById = this._generalService.userId;

    return history;
  }

  /**
   * add history
   * @param model
   * @param session
   * @returns {Promise<(TaskHistory & Document)[] | (TaskHistory & Document)>}
   */
  async addHistory(model: TaskHistory, session: ClientSession) {
    return await this.create([model], session);
  }

  /**
   * get all task history with pagination params
   * @param model
   * @returns {Promise<BasePaginatedResponse<TaskHistory>>}
   */
  async getTaskHistory(model: GetTaskHistoryModel) {
    await this._projectService.getProjectDetails(model.projectId);

    model.populate = [{
      path: 'createdBy',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }];

    model.sort = 'createdAt';
    model.sortBy = 'desc';

    const result: BasePaginatedResponse<TaskHistory> = await this.getAllPaginatedData({ taskId: model.taskId }, model);

    result.items = result.items.map(history => {
      history = this.parseHistoryObject(history);
      return history;
    });
    return result;
  }

  /**
   * parse history object
   * @param history
   * @returns {TaskHistory}
   */
  private parseHistoryObject(history: TaskHistory): TaskHistory {
    if (history.task) {
      history.task = {
        name: history.task.name,
        displayName: history.task.displayName,
        projectId: history.task.projectId,
        createdById: history.task.createdById
      };
    }
    return history;
  }
}
