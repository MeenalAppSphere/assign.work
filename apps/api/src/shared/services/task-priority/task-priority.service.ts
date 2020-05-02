import { BaseService } from '../base.service';
import { ClientSession, Document, Model } from 'mongoose';
import { DbCollection, Project, TaskPriorityModel, TaskTypeModel } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from '../project/project.service';
import { OnModuleInit } from '@nestjs/common';
import { aggregateConvert_idToId, BadRequest, generateUtcDate } from '../../helpers/helpers';
import { TaskPriorityUtilityService } from './task-priority.utility.service';
import { GeneralService } from '../general.service';

export class TaskPriorityService extends BaseService<TaskPriorityModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _utilityService: TaskPriorityUtilityService;

  constructor(
    @InjectModel(DbCollection.taskPriority) private readonly _taskPriorityModel: Model<TaskPriorityModel & Document>,
    private _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_taskPriorityModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new TaskPriorityUtilityService();
  }

  /**
   * add update a task priority
   * check project access
   * check model validations
   * @param model
   */
  async addUpdate(model: TaskPriorityModel) {
    return await this.withRetrySession(async (session: ClientSession) => {
      if (model.id) {
        await this.getDetails(model.projectId, model.id);
      }
      // get project details
      await this._projectService.getProjectDetails(model.projectId);

      // check task priority validations...
      this._utilityService.taskPriorityValidations(model);

      // check if duplicate
      if (model.id) {
        if (await this.isDuplicate(model, model.id)) {
          BadRequest('Duplicate Task Priority is not allowed..');
        }
      } else {
        if (await this.isDuplicate(model)) {
          BadRequest('Duplicate Task Priority is not allowed..');
        }
      }

      // task priority model
      const taskPriority = new TaskPriorityModel();
      taskPriority.projectId = model.projectId;
      taskPriority.name = model.name;
      taskPriority.color = model.color;
      taskPriority.description = model.description;
      taskPriority.createdById = this._generalService.userId;

      if (!model.id) {
        // add
        const newTaskPriority = await this.create([taskPriority], session);
        return newTaskPriority[0];
      } else {
        // update
        taskPriority.id = model.id;
        taskPriority.updatedById = this._generalService.userId;
        await this.updateById(model.id, taskPriority, session);
        return taskPriority;
      }
    });
  }

  /**
   * get all task priorities
   */
  public async getAllTaskPriorities(projectId: string) {
    await this._projectService.getProjectDetails(projectId);
    return this.dbModel.aggregate([{
      $match: { projectId: this.toObjectId(projectId), isDeleted: false }
    }, { $project: { createdAt: 0, updatedAt: 0, '__v': 0 } }, aggregateConvert_idToId]);
  }

  /**
   * create default task priority in respect of chosen template
   * @param taskPriorities
   * @param project
   * @param session
   */
  public async createDefaultTaskPriorities(taskPriorities: TaskPriorityModel[], project: Project, session: ClientSession) {
    taskPriorities = this._utilityService.prepareDefaultTaskPriorities(taskPriorities, project);

    return await this.createMany(taskPriorities, session) as Array<Document & TaskPriorityModel>;
  }

  /**
   * get task priority by id
   * @param projectId
   * @param taskPriorityId
   */
  async getTaskPriorityById(projectId: string, taskPriorityId: string) {
    try {
      await this._projectService.getProjectDetails(projectId);

      if (!this.isValidObjectId(taskPriorityId)) {
        BadRequest('Task Priority not found...');
      }

      const taskPriority = await this.findOne({
        filter: { projectId, _id: taskPriorityId },
        lean: true
      });

      if (taskPriority) {
        taskPriority.id = taskPriority._id;
      } else {
        BadRequest('Task Priority not found...');
      }

      return taskPriority;
    } catch (e) {
      throw e;
    }
  }

  /**
   * get task priority details by id
   * @param projectId
   * @param taskPriorityId
   */
  async getDetails(projectId: string, taskPriorityId: string) {
    try {
      if (!this.isValidObjectId(taskPriorityId)) {
        BadRequest('Task Priority not found..');
      }

      const taskPriorityDetail = await this.findOne({
        filter: { _id: taskPriorityId, projectId: projectId },
        lean: true
      });

      if (!taskPriorityDetail) {
        BadRequest('Task Priority not found...');
      } else {
        taskPriorityDetail.id = taskPriorityDetail._id;
      }

      return taskPriorityDetail;
    } catch (e) {
      throw e;
    }
  }

  /**
   * duplicate checker
   * check duplicity for name and color
   * if exceptThisId present than filter that record
   * @param taskPriority
   * @param exceptThisId
   */
  public async isDuplicate(taskPriority: TaskPriorityModel, exceptThisId: string = null): Promise<boolean> {
    const queryFilter = {
      $and: [
        { projectId: taskPriority.projectId },
        {
          $or: [
            { name: { $regex: `^${taskPriority.name.trim()}$`, $options: 'i' } },
            { color: { $regex: `^${taskPriority.color.trim()}$`, $options: 'i' } }
          ]
        }
      ]
    };

    // if exceptThisId present then filter the result for this id
    if (exceptThisId) {
      queryFilter.$and.push({ _id: { $ne: exceptThisId } } as any);
    }

    const result = await this.find({
      filter: queryFilter
    });

    return !!(result && result.length);
  }

}
