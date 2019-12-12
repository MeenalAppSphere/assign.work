import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddTaskToSprintModel,
  CreateSprintModel,
  DbCollection,
  Project,
  Sprint,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintErrorResponseItem,
  SprintStage,
  Task,
  User
} from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';

@Injectable()
export class SprintService extends BaseService<Sprint & Document> {
  constructor(
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private _generalService: GeneralService
  ) {
    super(_sprintModel);
  }

  public async createSprint(model: CreateSprintModel) {

    // region validations

    if (!model || !model.projectId) {
      throw new BadRequestException('invalid request');
    }

    if (!model.sprint.name) {
      throw new BadRequestException('Sprint Name is compulsory');
    }

    if (!model.sprint.startedAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    if (!model.sprint.endAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    const isStartDateBeforeToday = moment(model.sprint.startedAt).isBefore(moment());
    if (isStartDateBeforeToday) {
      throw new BadRequestException('Sprint Started date can not be Before Today');
    }

    const isEndDateBeforeTaskStartDate = moment(model.sprint.endAt).isBefore(model.sprint.startedAt);
    if (isEndDateBeforeTaskStartDate) {
      throw new BadRequestException('Sprint End Date can not be before Sprint Start Date');
    }

    // endregion

    // get project details and check if current user is member of project
    const projectDetails = await this.getProjectDetails(model.projectId);

    // add all project collaborators as sprint member and add their's work capacity
    projectDetails.members.forEach(member => {
      model.sprint.membersCapacity.push({
        userId: member.userId,
        workingCapacity: member.workingCapacity,
        workingCapacityPerDay: member.workingCapacityPerDay
      });
    });

    // create stages array for sprint from project
    projectDetails.settings.stages.forEach(stage => {
      const sprintStage = new SprintStage();
      sprintStage.id = stage.id;
      sprintStage.status = [];
      sprintStage.tasks = [];
      model.sprint.stages.push(sprintStage);
    });

    // create session and use it for whole transaction
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      return await this.create([model], session);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  public async addTaskToSprint(model: AddTaskToSprintModel) {
    if (!model || !model.projectId) {
      throw new BadRequestException('Project Not Found');
    }

    if (!model.sprintId) {
      throw new BadRequestException('Sprint Not Found');
    }

    if (!model.tasks || !model.tasks.length) {
      throw new BadRequestException('Please Add At Least One Task');
    }

    try {
      const sprintError: SprintErrorResponse = new SprintErrorResponse();
      const taskAssigneeMap: Array<{ memberId: string, totalEstimation: number }> = [];

      model.tasks.forEach(task => {
        const checkTask = this.checkTaskIsAllowedToAddInSprint(task);

        if (checkTask instanceof SprintErrorResponseItem) {
          sprintError.tasksErrors.push(checkTask);
        } else {
          const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === task.assigneeId);
          if (assigneeIndex > -1) {
            taskAssigneeMap[assigneeIndex].totalEstimation += task.estimatedTime;
          } else {
            taskAssigneeMap.push({
              memberId: task.assigneeId,
              totalEstimation: task.estimatedTime
            });
          }
        }
      });

      // check if we found some errors while checking tasks
      if (sprintError.tasksErrors.length) {
        return sprintError;
      }

      const projectDetails = await this.getProjectDetails(model.projectId);
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      const sprintDaysCount = moment(sprintDetails.startedAt).diff(sprintDetails.endAt, 'd') || 1;
    } catch (e) {
    }

  }

  private checkTaskIsAllowedToAddInSprint(task: Task): boolean | SprintErrorResponseItem {
    if (task) {
      const sprintError = new SprintErrorResponseItem();
      sprintError.name = task.displayName;

      if (!task.assigneeId) {
        sprintError.reason = SprintErrorEnum.taskNoAssignee;
      }

      if (!task.estimatedTime) {
        sprintError.reason = SprintErrorEnum.taskNoEstimate;
      }

      if (sprintError.reason) {
        return sprintError;
      }
      return true;
    } else {
      return {
        name: task.displayName,
        reason: SprintErrorEnum.taskNotFound
      };
    }
  }

  /**
   * get project details by id
   * @param id: project id
   */
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

  /**
   * get sprint details by sprint id
   * @param id: string sprint id
   */
  private async getSprintDetails(id: string) {
    const sprintDetails: Sprint = await this._sprintModel.findById(id).select('name startedAt endAt stages membersCapacity').lean().exec();

    if (!sprintDetails) {
      throw new NotFoundException('Sprint Not Found');
    }
    return sprintDetails;
  }
}
