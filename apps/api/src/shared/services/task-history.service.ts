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
import { basicUserPopulationDetails } from '../helpers/query.helper';

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
    // get project details
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);

    // set populate object
    model.populate = [{
      path: 'createdBy',
      select: basicUserPopulationDetails,
      justOne: true
    }];

    model.sort = 'createdAt';
    model.sortBy = 'desc';

    // get all histories by pagination
    const result: BasePaginatedResponse<TaskHistory> = await this.getAllPaginatedData({ taskId: model.taskId }, model);

    // loop over history and prepare vm
    result.items = result.items.map(history => {
      history = this.parseHistoryVm(history);

      // loop over project member's and find if history created by collaborator is removed from project or not
      projectDetails.members.forEach(member => {
        if (member.userId === history.createdById && history.createdBy) {
          history.createdBy.isRemovedFromCurrentProject = member.isRemoved;
        }
      });
      return history;
    });
    return result;
  }

  /**
   * parse history vm
   * @param history
   * @returns {TaskHistory}
   */
  private parseHistoryVm(history: TaskHistory): TaskHistory {
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
