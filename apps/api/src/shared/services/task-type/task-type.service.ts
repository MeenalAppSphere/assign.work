import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import { DbCollection, Project, TaskTypeModel } from '@aavantan-app/models';
import { ProjectService } from '../project/project.service';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Document, Model } from 'mongoose';
import { ModuleRef } from '@nestjs/core';
import { aggregateConvert_idToId, BadRequest } from '../../helpers/helpers';
import { TaskTypeUtilityService } from './task-type.utility.service';
import { GeneralService } from '../general.service';
import { TaskService } from '../task/task.service';
import { ProjectUtilityService } from '../project/project.utility.service';
import { DEFAULT_TASK_STATUS_COLOR } from '../../helpers/defaultValueConstant';

@Injectable()
export class TaskTypeService extends BaseService<TaskTypeModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _utilityService: TaskTypeUtilityService;
  private _projectUtilityService: ProjectUtilityService;

  constructor(
    @InjectModel(DbCollection.taskType) private readonly _taskTypeModel: Model<TaskTypeModel & Document>,
    private readonly _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_taskTypeModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._projectUtilityService = this._moduleRef.get(ProjectUtilityService.name);

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
      let taskTypeDetails: TaskTypeModel = null;
      if (model.id) {
        taskTypeDetails = await this.getDetails(model.projectId, model.id);
      }
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      // check task type validations...
      this._utilityService.taskTypeValidations(model);

      // check if duplicate
      if (model.id) {
        if (await this.isDuplicate(model, model.id)) {
          BadRequest('Duplicate Task Type is not allowed..');
        }
      } else {
        if (await this.isDuplicate(model)) {
          BadRequest('Duplicate Task Type is not allowed..');
        }
      }

      // check if new assignee is part of project
      const isAssigneePartOfProject = this._projectUtilityService.userPartOfProject(model.assigneeId, projectDetails);
      if (!isAssigneePartOfProject) {
        BadRequest('This assignee is not part of this Project');
      }

      // task type model
      const taskType = new TaskTypeModel();
      taskType.projectId = model.projectId;
      taskType.displayName = model.displayName;
      taskType.name = model.name;
      taskType.color = model.color;
      taskType.assigneeId = model.assigneeId || this._generalService.userId;
      taskType.description = model.description;
      taskType.createdById = this._generalService.userId;

      if (!model.id) {
        // add
        const newTaskType = await this.create([taskType], session);
        return newTaskType[0];
      } else {
        // update
        taskType.id = model.id;
        taskType.updatedById = this._generalService.userId;
        await this.updateById(model.id, taskType, session);

        // region update task display name
        // task type display name is changed
        if (taskTypeDetails.displayName !== taskType.displayName) {
          // update tasks whose task type display name ic changed
          const filterForTasks = {
            projectId: model.projectId,
            displayName: { '$regex': new RegExp('^' + taskTypeDetails.displayName.toLowerCase()), $options: 'i' }
          };

          // find task with current display name
          const tasksWithDisplayName = await this._taskService.find({
            filter: filterForTasks, lean: true, select: 'displayName'
          });

          // loop over tasks
          if (tasksWithDisplayName && tasksWithDisplayName.length) {
            // update display name

            // loop over each task, set task name and update it
            for (let i = 0; i < tasksWithDisplayName.length; i++) {
              const task = tasksWithDisplayName[i];

              // separate display name with '-'
              const tempDisplayName = task.displayName.split('-');
              task.displayName = `${model.displayName}-${tempDisplayName[1]}`;

              // update task display name
              await this._taskService.updateById(tasksWithDisplayName[i]._id, { displayName: task.displayName }, session);
            }
          }
        }
        // endregion
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
   * add missing assignee field in task type
   * we decided to add default assignee feature in task type
   * so need to update existing status with default assignee ( project creator ) that user can update later
   */
  async addMissingAssigneeFiled() {
    return this.withRetrySession(async (session: ClientSession) => {
      const typesWithNoAssigneeIdQuery = {
        assigneeId: { $in: [undefined, null, ''] }
      };

      // get types who has no assignee id in db
      const typesWithNoAssigneeId = await this.find({ filter: typesWithNoAssigneeIdQuery, lean: true });
      if (typesWithNoAssigneeId && typesWithNoAssigneeId.length) {

        // loop over task types
        for (let i = 0; i < typesWithNoAssigneeId.length; i++) {
          const taskType = typesWithNoAssigneeId[i];
          // update
          await this.updateById(taskType._id, { assigneeId: taskType.createdById }, session);
        }
      }

      return 'Default assignee added successfully';
    });
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
