import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import { DbCollection, Project, TaskStatusModel, TaskTypeModel } from '@aavantan-app/models';
import { ProjectService } from '../project/project.service';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Document, Model } from 'mongoose';
import { ModuleRef } from '@nestjs/core';
import { aggregateConvert_idToId, BadRequest, generateUtcDate } from '../../helpers/helpers';
import { TaskTypeUtilityService } from './task-type.utility.service';
import { GeneralService } from '../general.service';

@Injectable()
export class TaskTypeService extends BaseService<TaskTypeModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _utilityService: TaskTypeUtilityService;

  constructor(
    @InjectModel(DbCollection.taskType) private readonly _taskTypeModel: Model<TaskTypeModel & Document>,
    private readonly _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_taskTypeModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new TaskTypeUtilityService();
  }

  /**
   * add update a task type
   * check project access
   * check model validations
   * @param model
   */
  async addUpdate(model: TaskTypeModel) {
    return await this.withRetrySession(async (session: ClientSession) => {
      if (model.id) {
        await this.getDetails(model.projectId, model.id);
      }
      // get project details
      await this._projectService.getProjectDetails(model.projectId);

      // check task type validations...
      this._utilityService.taskTypeValidations(model);

      // check if duplicate
      if (model.id) {
        if (await this.isDuplicate(model, model.id)) {
          BadRequest('Duplicate Task Type is not allowed..');
        }
      }else {
        if (await this.isDuplicate(model)) {
          BadRequest('Duplicate Task Type is not allowed..');
        }
      }

      const taskType = new TaskTypeModel();
      taskType.projectId = model.projectId;
      taskType.displayName = model.displayName;
      taskType.name = model.name;
      taskType.color = model.color;
      taskType.description = model.description;
      taskType.createdById = this._generalService.userId;

      if (!model.id) {
        const newTaskType = await this.create([taskType], session);
        return newTaskType[0];
      } else {

        taskType.id = model.id;
        taskType.updatedById = this._generalService.userId;
        taskType.updatedAt = generateUtcDate();

        await this.updateById(model.id, taskType, session);

        return taskType;


      }
    });
  }

  /**
   * get all task types
   */
  public async getAllTaskTypes(projectId: string) {
    await this._projectService.getProjectDetails(projectId);
    return this.dbModel.aggregate([{
      $match: { projectId: this.toObjectId(projectId), isDeleted: false }
    }, { $project: { createdAt: 0, updatedAt: 0, '__v': 0 } }, aggregateConvert_idToId]);
  }

  /**
   * create default task type in respect of chosen template
   * @param taskTypes
   * @param project
   * @param session
   */
  public async createDefaultTaskTypes(taskTypes: TaskTypeModel[], project: Project, session: ClientSession) {
    taskTypes = this._utilityService.prepareDefaultTaskTypes(taskTypes, project);

    return await this.createMany(taskTypes, session) as Array<Document & TaskTypeModel>;
  }

  /**
   * get task type by id
   * @param projectId
   * @param taskTypeId
   */
  async getTaskTypeById(projectId: string, taskTypeId: string) {
    try {
      await this._projectService.getProjectDetails(projectId);

      if (!this.isValidObjectId(taskTypeId)) {
        BadRequest('Task Type not found...');
      }

      const taskType = await this.findOne({
        filter: { projectId, _id: taskTypeId },
        lean: true
      });

      if (taskType) {
        taskType.id = taskType._id;
      } else {
        BadRequest('Task Type not found...');
      }

      return taskType;
    } catch (e) {
      throw e;
    }
  }

  /**
   * get task type details by id
   * @param projectId
   * @param taskTypeId
   */
  async getDetails(projectId: string, taskTypeId: string): Promise<TaskTypeModel> {
    try {
      if (!this.isValidObjectId(taskTypeId)) {
        BadRequest('Task Type not found..');
      }

      const taskTypeDetail = await this.findOne({
        filter: { _id: taskTypeId, projectId: projectId },
        lean: true
      });

      if (!taskTypeDetail) {
        BadRequest('Task Type not found...');
      } else {
        taskTypeDetail.id = taskTypeDetail._id;
      }

      return taskTypeDetail;
    } catch (e) {
      throw e;
    }
  }

  /**
   * duplicate checker
   * check duplicity for name, display name and color
   * if exceptThisId present than filter that record
   * @param taskType
   * @param exceptThisId
   */
  public async isDuplicate(taskType: TaskTypeModel, exceptThisId: string = null): Promise<boolean> {
    const queryFilter = {
      $and: [
        { projectId: taskType.projectId },
        {
          $or: [
            { name: { $regex: `^${taskType.name.trim()}$`, $options: 'i' } },
            { color: { $regex: `^${taskType.color.trim()}$`, $options: 'i' } },
            { displayName: { $regex: `^${taskType.displayName.trim()}$`, $options: 'i' } }
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
