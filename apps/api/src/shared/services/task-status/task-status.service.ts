import { BaseService } from '../base.service';
import { TaskStatusModel } from '../../../../../../libs/models/src/lib/models/task-status.model';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection } from '@aavantan-app/models';
import { ProjectService } from '../project/project.service';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TaskStatusUtilityService } from './task-status.utility.service';
import { BadRequest } from '../../helpers/helpers';

export class TaskStatusService extends BaseService<TaskStatusModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _utilityService: TaskStatusUtilityService;

  constructor(
    @InjectModel(DbCollection.taskStatus) protected readonly _taskStatusModel: Model<TaskStatusModel & Document>,
    private readonly _moduleRef: ModuleRef
  ) {
    super(_taskStatusModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new TaskStatusUtilityService();
  }

  /**
   * add update a status
   * @param model
   */
  async addUpdate(model: TaskStatusModel) {

    this.withRetrySession(async (session: ClientSession) => {
      await this._projectService.getProjectDetails(model.projectId);

      if (model.id) {
        await this.getDetails(model.id, model.projectId);
      }

      // check basic validations...
      this._utilityService.statusValidations(model);

      // check if duplicate
      if (await this.isDuplicate(model)) {
        BadRequest('Status name is already taken, please choose different');
      }

      const status = new TaskStatusModel();
      status.name = model.name;
      status.projectId = model.projectId;
      status.categoryId = model.categoryId;

      if (!model.id) {
        return await this.create([status], session);
      } else {
        // perform update status here..
      }

    });
  }

  /**
   * get all statuses by project id
   * @param projectId
   * @param onlyCategory
   */
  async getAllStatues(projectId: string, onlyCategory: boolean) {
    try {
      await this._projectService.getProjectDetails(projectId);

      const queryFilter = {
        projectId: projectId
      };

      // if onlyCategory true then only return top level statuses who have no category as parent
      if (onlyCategory) {
        queryFilter['categoryId'] = null;
      }

      return await this.find({ filter: queryFilter, populate: 'category' });
    } catch (e) {
      throw e;
    }
  }

  /**
   * get status by id
   * @param projectId
   * @param statusId
   */
  async getStatusById(projectId: string, statusId: string) {
    try {
      await this._projectService.getProjectDetails(projectId);

      if (!this.isValidObjectId(statusId)) {
        BadRequest('Status not found...');
      }

      const status = await this.findOne({
        filter: { projectId, _id: statusId },
        populate: 'category',
        lean: true
      });

      if (status) {
        status.id = status._id;
        return status;
      } else {
        BadRequest('Status not found...');
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * get status details by id
   * @param statusId
   * @param projectId
   */
  async getDetails(statusId: string, projectId: string) {
    if (!this.isValidObjectId(statusId)) {
      throw new NotFoundException('Status not found');
    }

    const statusDetail = await this.findOne({
      filter: { _id: statusId, projectId: projectId },
      lean: true
    });

    if (!statusDetail) {
      throw new NotFoundException('Status not found');
    }
  }

  /**
   * is duplicate status
   * @param model
   * @param exceptThis
   */
  private async isDuplicate(model: TaskStatusModel, exceptThis?: string): Promise<boolean> {
    const queryFilter = {
      projectId: model.projectId, name: model.name.trim().toLowerCase()
    };

    if (exceptThis) {
      queryFilter['_id'] = { $ne: exceptThis };
    }

    const queryResult = await this.find({
      filter: queryFilter
    });

    return !!(queryResult && queryResult.length);
  }
}
