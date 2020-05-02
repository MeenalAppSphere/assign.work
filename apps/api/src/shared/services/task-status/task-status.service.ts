import { BaseService } from '../base.service';
import { BoardColumns, DbCollection, DeleteStatusModel, Project, TaskStatusModel } from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ProjectService } from '../project/project.service';
import { OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TaskStatusUtilityService } from './task-status.utility.service';
import { BadRequest, generateUtcDate } from '../../helpers/helpers';
import { GeneralService } from '../general.service';
import { BoardService } from '../board/board.service';
import { TaskService } from '../task/task.service';
import { BoardUtilityService } from '../board/board.utility.service';

export class TaskStatusService extends BaseService<TaskStatusModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _boardService: BoardService;
  private _boardUtilityService: BoardUtilityService;
  private _utilityService: TaskStatusUtilityService;

  constructor(
    @InjectModel(DbCollection.taskStatus) protected readonly _taskStatusModel: Model<TaskStatusModel & Document>,
    private readonly _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_taskStatusModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get(TaskService);
    this._boardService = this._moduleRef.get('BoardService');

    this._utilityService = new TaskStatusUtilityService();
    this._boardUtilityService = new BoardUtilityService();
  }

  /**
   * add update a status
   * @param model
   */
  async addUpdate(model: TaskStatusModel) {

    return this.withRetrySession(async (session: ClientSession) => {
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      if (model.id) {
        await this.getDetails(model.id, model.projectId);
      }

      // check basic validations...
      this._utilityService.statusValidations(model);

      // check if duplicate
      if (model.id) {
        if (await this.isDuplicate(model, model.id)) {
          BadRequest('Status title is already taken, please choose different');
        }
      }else {
        if (await this.isDuplicate(model)) {
          BadRequest('Status title is already taken, please choose different');
        }
      }

      const status = new TaskStatusModel();
      status.name = model.name;
      status.projectId = model.projectId;
      status.description = model.description;
      status.createdById = this._generalService.userId;

      if (!model.id) {
        // create new status
        const newStatus = await this.create([status], session);

        // update project
        await this._projectService.updateById(model.projectId, {
          $push: { 'settings.statuses': newStatus[0] }
        }, session);

        // update board and add this status as a column
        if (projectDetails.activeBoardId) {
          const boardDetails = await this._boardService.getDetails(projectDetails.activeBoardId, model.projectId);

          // create new column object
          const column = new BoardColumns();
          column.headerStatusId = newStatus[0]._id;
          column.includedStatuses = [{
            statusId: newStatus[0]._id,
            defaultAssigneeId: this._generalService.userId,
            isShown: true
          }];
          column.columnColor = '';
          column.columnOrderNo = 0;
          column.isHidden = false;

          const boardUpdateObject = {
            $push: {
              'columns': column
            }
          };

          // update board by id
          await this._boardService.updateById(projectDetails.activeBoardId, boardUpdateObject, session);
        }

        newStatus[0].id = newStatus[0]._id;
        return newStatus[0];
      } else {

        status.id = model.id;
        status.updatedById = this._generalService.userId;
        status.updatedAt = generateUtcDate();

        await this.updateById(model.id, status, session);

        return status;

      }

    });
  }

  async deleteStatus(model: DeleteStatusModel) {
    if (!model) {
      BadRequest('Status not found');
    }

    return this.withRetrySession(async (session: ClientSession) => {
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId, true);

      // get status details
      const statusDetails = await this.getDetails(model.statusId, model.projectId);

      const tasksOfStatusQuery = {
        projectId: model.projectId,
        statusId: model.statusId,
        isDeleted: false
      };

      // get all tasks of this status
      const statusUsedInTasks = await this._taskService.dbModel.countDocuments(tasksOfStatusQuery);

      // if tasks found for this status
      if (statusUsedInTasks > 0) {
        // if nextStatus is not chosen that set haveTasks to true and return it, so ui can show a popup for selecting next status
        if (!model.nextStatusId) {
          model.haveTasks = true;
          return model;
        } else {
          // process delete status and update old tasks with the new status
          const nextStatusDetails = await this.getDetails(model.nextStatusId, model.projectId);

          // update all tasks and update status to nextStatus
          await this._taskService.update(tasksOfStatusQuery, { $set: { statusId: model.nextStatusId } }, session);
        }
      } else {
        // delete status process
        await this.delete(model.statusId, session);
      }

    });
  }

  private async deleteStatusProcess(statusId: string, project: Project, session: ClientSession) {
    // delete column from board
    const columnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, statusId);

    if (columnIndex > -1) {

    } else {

    }
  }

  /**
   * get all statuses by project id
   * @param projectId
   */
  async getAllStatues(projectId: string) {
    try {
      await this._projectService.getProjectDetails(projectId);

      const queryFilter = {
        projectId: projectId
      };

      return await this.find({ filter: queryFilter });
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
   * create default statues for project
   * @param project
   * @param session
   */
  async createDefaultStatuses(project: Project, session: ClientSession): Promise<Array<Document & TaskStatusModel>> {
    const defaultStatuses = this._utilityService.prepareDefaultStatuses(project);

    return await this.createMany(defaultStatuses, session) as Array<Document & TaskStatusModel>;
  }

  /**
   * get status details by id
   * @param statusId
   * @param projectId
   */
  async getDetails(statusId: string, projectId: string) {
    try {
      if (!this.isValidObjectId(statusId)) {
        BadRequest('Status not found');
      }

      const statusDetail = await this.findOne({
        filter: { _id: statusId, projectId: projectId },
        lean: true
      });

      if (!statusDetail) {
        BadRequest('Status not found');
      } else {
        statusDetail.id = statusDetail._id;
      }

      return statusDetail;
    } catch (e) {
      throw e;
    }
  }

  /**
   * is duplicate status
   * @param model
   * @param exceptThis
   */
  private async isDuplicate(model: TaskStatusModel, exceptThis?: string): Promise<boolean> {
    const queryFilter = {
      projectId: model.projectId, name: { $regex: `^${model.name.trim()}$`, $options: 'i' }
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
