import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import { DbCollection, TaskType } from '@aavantan-app/models';
import { ProjectService } from '../project/project.service';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Document, Model } from 'mongoose';
import { ModuleRef } from '@nestjs/core';
import { aggregateConvert_idToId, BadRequest } from '../../helpers/helpers';
import { TaskTypeUtilityService } from './task-type.utility.service';

@Injectable()
export class TaskTypeService extends BaseService<TaskType & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _utilityService: TaskTypeUtilityService;

  constructor(
    @InjectModel(DbCollection.taskType) private readonly _taskTypeModel: Model<TaskType & Document>,
    private _moduleRef: ModuleRef
  ) {
    super(_taskTypeModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new TaskTypeUtilityService();
  }

  /**
   * add update a task type
   * check project access
   * check model validations
   * @param model
   */
  async addUpdate(model: TaskType) {
    return await this.withRetrySession(async (session: ClientSession) => {
      if (model.id) {
        await this.getDetails(model.projectId, model.id);
      }
      // get project details
      await this._projectService.getProjectDetails(model.projectId);

      // check task type validations...
      this._utilityService.taskTypeValidations(model);

      const taskType = new TaskType();
      taskType.projectId = model.projectId;
      taskType.displayName = model.displayName;
      taskType.name = model.name;
      taskType.color = model.color;

      if (!model.id) {
        const newTaskType = await this.create([taskType], session);
        return newTaskType[0];
      } else {
        // update task type by id
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
   * get task type by id
   * @param projectId
   * @param taskTypeId
   */
  async getTaskTypeById(projectId: string, taskTypeId: string) {
    try {
      await this._projectService.getProjectDetails(projectId);

      if (!this.isValidObjectId(taskTypeId)) {
        BadRequest('Task type not found...');
      }

      const taskType = await this.findOne({
        filter: { projectId, _id: taskTypeId },
        lean: true
      });

      if (taskType) {
        taskType.id = taskType._id;
        return taskType;
      } else {
        BadRequest('Task type not found...');
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * get task type details by id
   * @param projectId
   * @param taskTypeId
   */
  async getDetails(projectId: string, taskTypeId: string) {
    if (!this.isValidObjectId(taskTypeId)) {
      throw new NotFoundException('Task Type not found..');
    }

    const taskTypeDetail = await this.findOne({
      filter: { _id: taskTypeId, projectId: projectId },
      lean: true
    });

    if (!taskTypeDetail) {
      throw new NotFoundException('Task Type not found...');
    }
  }

  /**
   * duplicate checker
   * check duplicity for name, display name and color
   * if exceptThisId present than filter that record
   * @param taskType
   * @param exceptThisId
   */
  public async isDuplicate(taskType: TaskType, exceptThisId: string = null): Promise<boolean> {
    const queryFilter = {
      $and: [
        { projectId: taskType.projectId },
        {
          $or: [
            { name: taskType.name.trim() },
            { color: taskType.color.trim() },
            { displayName: taskType.displayName.trim() }
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
