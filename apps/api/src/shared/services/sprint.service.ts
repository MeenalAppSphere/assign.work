import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddTaskToSprintModel,
  CreateSprintModel,
  DbCollection,
  MoveTaskToStage,
  Project,
  Sprint,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintErrorResponseItem,
  SprintStage,
  Task,
  TaskAssigneeMap,
  TaskTimeLog,
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
    @InjectModel(DbCollection.tasks) protected readonly _taskModel: Model<Task & Document>,
    @InjectModel(DbCollection.taskTimeLog) protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>,
    private _generalService: GeneralService
  ) {
    super(_sprintModel);
  }

  /**
   * create sprint
   * @param model: CreateSprintModel
   */
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

  /**
   * add task to a sprint
   * @param model
   */
  public async addTaskToSprint(model: AddTaskToSprintModel) {
    // region basic validation

    // project id
    if (!model || !model.projectId) {
      throw new BadRequestException('Project Not Found');
    }

    // sprint id
    if (!model.sprintId) {
      throw new BadRequestException('Sprint Not Found');
    }

    // tasks array
    if (!model.tasks || !model.tasks.length) {
      throw new BadRequestException('Please Add At Least One Task');
    }
    // endregion

    // start the session
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      // get project details by project id
      const projectDetails = await this.getProjectDetails(model.projectId);

      // get all tasks details from given tasks array
      const taskDetails: Task[] = await this._taskModel.find({
        projectId: this.toObjectId(model.projectId),
        _id: { $in: model.tasks },
        isDeleted: false
      }).lean();

      // check if there any task found
      if (!taskDetails.length) {
        // if no return an error
        return new BadRequestException('no tasks found');
      }

      // sprint error holder variable
      const sprintError: SprintErrorResponse = new SprintErrorResponse();

      // task assignee details holder variable
      const taskAssigneeMap: TaskAssigneeMap[] = [];

      // loop over all the tasks
      taskDetails.forEach(task => {
        // check if task is allowed to added to sprint
        const checkTask = this.checkTaskIsAllowedToAddInSprint(task);

        // check if error is returned from check task method
        if (checkTask instanceof SprintErrorResponseItem) {

          // add error to sprint task error holder
          sprintError.tasksErrors.push(checkTask);
        } else {
          // no error then get task assignee id and push it to the task assignee mapping holder variable
          const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === task.assigneeId);

          // if assignee already added then only update it's totalEstimation
          if (assigneeIndex > -1) {
            taskAssigneeMap[assigneeIndex].totalEstimation += task.estimatedTime;
          } else {
            // push assignee to assignee task map holder variable
            taskAssigneeMap.push({
              memberId: task.assigneeId,
              totalEstimation: task.estimatedTime,
              workingCapacityPerDay: 0,
              alreadyLoggedTime: 0
            });
          }
        }
      });

      // check if we found some errors while checking tasks return that error
      if (sprintError.tasksErrors.length) {
        return sprintError;
      }

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      // get sprint count days from sprint start date and end date
      const sprintDaysCount = moment(sprintDetails.startedAt).diff(sprintDetails.endAt, 'd') || 1;

      // fill member working capacity from sprint details in assignee task map holder variable
      sprintDetails.membersCapacity.forEach(member => {
        // find assignee index and update it's working capacity from sprint details
        const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === member.userId);
        taskAssigneeMap[assigneeIndex].workingCapacityPerDay = member.workingCapacityPerDay;
      });

      // loop over assignee's and get their logged time
      for (let i = 0; i < taskAssigneeMap.length; i++) {
        // get assignee logged time for start and end date of sprint
        const assigneeAlreadyLoggedForTheDate = await this._taskTimeLogModel.find({
          createdById: this.toObjectId(taskAssigneeMap[i].memberId),
          startedAt: { '$gte': moment(sprintDetails.startedAt).startOf('day').toDate() },
          endAt: { '$lt': moment(sprintDetails.endAt).endOf('day').toDate() },
          isDeleted: false
        });

        // calculate total of already logged time of assignee
        if (assigneeAlreadyLoggedForTheDate && assigneeAlreadyLoggedForTheDate.length) {
          taskAssigneeMap[i].alreadyLoggedTime = assigneeAlreadyLoggedForTheDate.reduce((acc, cur) => {
            return acc + cur.loggedTime;
          }, 0);
        }

        // if assignee already logged time + assignee's total estimation from above sprint tasks
        // is greater
        // assignee working limit per sprint
        // return error ( member working capacity exceed )
        if ((taskAssigneeMap[i].alreadyLoggedTime + taskAssigneeMap[i].totalEstimation) > ((taskAssigneeMap[i].workingCapacityPerDay * 3600) * sprintDaysCount)) {
          sprintError.membersErrors.push({
            id: taskAssigneeMap[i].memberId,
            reason: SprintErrorEnum.memberCapacityExceed
          });
        }

      }

      // check if we found some errors while checking users availability
      if (sprintError.membersErrors.length) {
        return sprintError;
      }

      // now all validations have been completed add task to sprint
      taskDetails.forEach(task => {
        sprintDetails.stages[0].totalEstimation += task.estimatedTime;
        sprintDetails.stages[0].tasks.push({
          taskId: task.id,
          addedAt: new Date(),
          addedById: this._generalService.userId
        });
      });

      // update sprint
      await this.update(model.sprintId, sprintDetails, session);
      await session.commitTransaction();
      session.endSession();
      return 'Sprint Created Successfully';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }

  }

  /**
   * move task to a particular stage
   * @param model
   */
  public async moveTaskToStage(model: MoveTaskToStage) {
    // region validation

    // project id
    if (!model || !model.projectId) {
      throw new BadRequestException('Project not found');
    }

    // sprint id
    if (!model.sprintId) {
      throw new BadRequestException('Sprint not found');
    }

    // stage id
    if (!model.stageId) {
      throw new BadRequestException('Stage not found');
    }

    //task
    if (!model.taskId) {
      throw new BadRequestException('Task not found');
    }
    // endregion

    // start the session
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      // get project details
      const projectDetails = await this.getProjectDetails(model.projectId);

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      // get all tasks details from given tasks array
      const taskDetail: Task = await this._taskModel.findOne({
        projectId: this.toObjectId(model.projectId),
        _id: model.taskId,
        isDeleted: false
      }).lean();

      if (!taskDetail) {
        return new BadRequestException('Task not found');
      }

      const checkTaskIsAllowedToMove = this.checkTaskIsAllowedToAddInSprint(taskDetail);

      if (checkTaskIsAllowedToMove instanceof SprintErrorResponseItem) {
        return checkTaskIsAllowedToMove;
      }

      // find current stage id where task is already added
      const currentStageId = sprintDetails.stages.find(stage => {
        return stage.tasks.some(task => task.taskId === model.taskId);
      }).id;

      // loop over stages
      sprintDetails.stages.forEach((stage) => {

        // remove task from current stage and minus estimation time from total stage estimation time
        if (stage.id === currentStageId) {
          stage.totalEstimation -= taskDetail.estimatedTime;
          stage.tasks = stage.tasks.filter(task => !task.taskId !== taskDetail['_id']);
        }

        // add task to new stage id and also add task estimation to stage total estimation
        if (stage.id === model.stageId) {
          stage.totalEstimation += taskDetail.estimatedTime;
          stage.tasks.push({
            taskId: taskDetail.id,
            addedAt: new Date(),
            updatedAt: new Date(),
            addedById: this._generalService.userId
          });
        }
      });

      // update sprint
      await this.update(model.sprintId, sprintDetails, session);
      await session.commitTransaction();
      session.endSession();
      return 'Task Moved Successfully';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * check whether task is valid or not to add in sprint or move in a stage
   * @param task
   */
  private checkTaskIsAllowedToAddInSprint(task: Task): boolean | SprintErrorResponseItem {
    // check if task found
    if (task) {
      const sprintError = new SprintErrorResponseItem();
      sprintError.name = task.displayName;

      // check task assignee
      if (!task.assigneeId) {
        sprintError.reason = SprintErrorEnum.taskNoAssignee;
      }

      // check task estimation
      if (!task.estimatedTime) {
        sprintError.reason = SprintErrorEnum.taskNoEstimate;
      }

      // if there any error return error
      if (sprintError.reason) {
        return sprintError;
      }
      // return true if no error
      return true;
    } else {
      // if task not found return error
      return {
        id: task['_id'],
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
