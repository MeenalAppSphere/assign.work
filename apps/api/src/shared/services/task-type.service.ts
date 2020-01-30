import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from './base.service';
import { DbCollections, TaskType } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { convert_idToId, isValidString } from '../helpers/helpers';
import { ProjectService } from './project.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class TaskTypeService extends BaseService<TaskType & Document> implements OnModuleInit {
  private _projectService: ProjectService;

  constructor(
    @InjectModel(DbCollections.taskType) private readonly _taskTypeModel: Model<TaskType & Document>,
    private _moduleRef: ModuleRef
  ) {
    super(_taskTypeModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
  }

  /**
   * get all task types
   */
  public async getAllTaskTypes(projectId: string) {
    await this._projectService.getProjectDetails(projectId);
    return this.dbModel.aggregate([{
      $match: { projectId: this.toObjectId(projectId), isDeleted: false }
    }, { $project: { createdAt: 0, updatedAt: 0, '__v': 0 } }, convert_idToId]);
  }

  /**
   * check common validation for creating/ updating task type
   * @param taskType
   */
  public commonValidations(taskType) {
    if (!taskType || !taskType.name) {
      throw new BadRequestException('Please add Task Type name');
    }

    // name validation
    if (!isValidString(taskType.name)) {
      throw new BadRequestException('No special characters allowed in name');
    }

    // display name validation
    if (!taskType.displayName) {
      throw new BadRequestException('Please add Task Type display name');
    }

    // valid display name
    if (!isValidString(taskType.displayName)) {
      throw new BadRequestException('No special characters allowed in display name');
    }

    // color validation
    if (!taskType.color) {
      throw new BadRequestException('Please choose color');
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
