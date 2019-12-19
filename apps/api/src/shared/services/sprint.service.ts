import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddTaskToSprintModel,
  BasePaginatedResponse,
  CreateSprintModel,
  DbCollection,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel,
  MoveTaskToStage,
  Project,
  PublishSprintModel,
  Sprint,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintErrorResponseItem,
  SprintStage,
  SprintStatusEnum,
  Task,
  TaskAssigneeMap,
  TaskTimeLog,
  UpdateSprintMemberWorkingCapacity,
  User
} from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';
import { secondsToString, stringToSeconds } from '../helpers/helpers';

const commonPopulationForSprint = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'updatedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'membersCapacity.user',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}];

const detailedPopulationForSprint = [...commonPopulationForSprint, {
  path: 'stages.tasks.addedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'stages.tasks.task',
  select: 'name displayName description createdBy',
  justOne: true
}];

const commonFieldSelection = 'name startedAt endAt goal sprintStatus membersCapacity totalCapacity totalEstimation totalLoggedTime createdById updatedById';
const detailedFiledSelection = `${commonFieldSelection} stages `;

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
   * get all sprints
   * with pagination
   * @param model
   */
  public async getAllSprints(model: GetAllSprintRequestModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);

    // set populate fields
    model.populate = [{
      path: 'createdBy',
      select: 'emailId userName firstName lastName profilePic -_id',
      justOne: true
    }];

    // set selection fields
    model.select = '_id name startedAt endAt goal projectId sprintStatus createdById';

    const filter = {
      projectId: this.toObjectId(model.projectId)
    };
    const result: BasePaginatedResponse<Sprint> = await this.getAllPaginatedData(filter, model);

    // loop over sprints array and prepare vm object for all sprints
    result.items.forEach(sprint => {
      sprint = this.prepareSprintVm(sprint);
    });
    return result;
  }

  /**
   * get sprint by sprint id
   * model: GetSprintByIdRequestModel
   */
  public async getSprintById(model: GetSprintByIdRequestModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);

    const query = this._sprintModel.findOne({
      _id: model.sprintId,
      projectId: model.projectId,
      isDeleted: false
    });

    query.populate(detailedPopulationForSprint);
    query.lean();

    const sprint = await this.getSprintDetails(model.sprintId, detailedPopulationForSprint, detailedFiledSelection);
    return this.prepareSprintVm(sprint);
  }

  /**
   * create sprint
   * @param model: CreateSprintModel
   */
  public async createSprint(model: CreateSprintModel) {
    // region validations
    // sprint
    if (!model.sprint) {
      throw new BadRequestException('invalid request sprint details missing');
    }

    // sprint name
    if (!model.sprint.name) {
      throw new BadRequestException('Sprint Name is compulsory');
    }

    // sprint started at
    if (!model.sprint.startedAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    // sprint end at
    if (!model.sprint.endAt) {
      throw new BadRequestException('Please select Sprint End Date');
    }

    // started date can not be before today
    const isStartDateBeforeToday = moment(model.sprint.startedAt).isBefore(moment().startOf('d'));
    if (isStartDateBeforeToday) {
      throw new BadRequestException('Sprint Started date can not be Before Today');
    }

    // end date can not be before start date
    const isEndDateBeforeTaskStartDate = moment(model.sprint.endAt).isBefore(model.sprint.startedAt);
    if (isEndDateBeforeTaskStartDate) {
      throw new BadRequestException('Sprint End Date can not be before Sprint Start Date');
    }

    // endregion

    // get project details and check if current user is member of project
    const projectDetails = await this.getProjectDetails(model.sprint.projectId);

    // add all project collaborators as sprint member and add their's work capacity to total capacity
    model.sprint.membersCapacity = [];
    model.sprint.totalCapacity = 0;

    projectDetails.members.forEach(member => {
      model.sprint.membersCapacity.push({
        userId: member.userId,
        workingCapacity: member.workingCapacity,
        workingCapacityPerDay: member.workingCapacityPerDay
      });
      model.sprint.totalCapacity += member.workingCapacityPerDay;
    });

    // create stages array for sprint from project
    model.sprint.stages = [];
    projectDetails.settings.stages.forEach(stage => {
      const sprintStage = new SprintStage();
      sprintStage.id = stage.id;
      sprintStage.status = [];
      sprintStage.tasks = [];
      sprintStage.totalEstimation = 0;
      model.sprint.stages.push(sprintStage);
    });

    // set sprint created by id
    model.sprint.createdById = this._generalService.userId;

    // create session and use it for whole transaction
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      const newSprint = await this.create([model.sprint], session);
      await session.commitTransaction();
      session.endSession();

      const sprint = await this.getSprintDetails(newSprint[0].id, commonPopulationForSprint, commonFieldSelection);
      return this.prepareSprintVm(sprint);
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
        throw new BadRequestException('no tasks found');
      }

      if (taskDetails.length < model.tasks.length) {
        throw new BadRequestException('one of tasks not found');
      }

      // sprint error holder variable
      const sprintError: SprintErrorResponse = new SprintErrorResponse();
      sprintError.tasksErrors = [];
      sprintError.membersErrors = [];

      // task assignee details holder variable
      const taskAssigneeMap: TaskAssigneeMap[] = [];

      // loop over all the tasks
      taskDetails.forEach(task => {
        task.id = task['_id'];
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
              // convert object id to string
              memberId: (task.assigneeId as any).toHexString(),
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
      const sprintDaysCount = moment(sprintDetails.endAt).diff(sprintDetails.startedAt, 'd') || 1;

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
      sprintDetails.totalEstimation = 0;

      for (let i = 0; i < taskDetails.length; i++) {
        await this._taskModel.updateOne({ _id: taskDetails[i].id }, { sprintId: model.sprintId }, session);

        sprintDetails.totalEstimation += taskDetails[i].estimatedTime;

        sprintDetails.stages[0].totalEstimation += taskDetails[i].estimatedTime;
        sprintDetails.stages[0].tasks.push({
          taskId: taskDetails[i].id,
          addedAt: new Date(),
          addedById: this._generalService.userId
        });
      }

      // set total remaining capacity by dividing sprint members totalCapacity - totalEstimation
      sprintDetails.totalRemainingCapacity = sprintDetails.totalCapacity - sprintDetails.totalEstimation;
      sprintDetails.totalRemainingTime = sprintDetails.totalEstimation - sprintDetails.totalLoggedTime;

      // update sprint
      await this.update(model.sprintId, sprintDetails, session);
      await session.commitTransaction();
      session.endSession();

      const sprint = await this.getSprintDetails(model.sprintId, commonPopulationForSprint, commonFieldSelection);
      return this.prepareSprintVm(sprint);
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

      // check task is in sprint or not
      const isTaskInSprint = sprintDetails.stages.some(stage => stage.tasks.some(task => task.taskId.toString() === model.taskId));

      if (!isTaskInSprint) {
        throw new BadRequestException('This Task is not added in sprint');
      }

      // get all tasks details from given tasks array
      const taskDetail: Task = await this._taskModel.findOne({
        projectId: this.toObjectId(model.projectId),
        _id: model.taskId,
        isDeleted: false
      }).lean();

      if (!taskDetail) {
        throw new BadRequestException('Task not found');
      }

      // check task is in given sprint
      if (taskDetail.sprintId.toString() !== model.sprintId) {
        throw new BadRequestException('This Task is not added in sprint');
      }

      taskDetail.id = taskDetail['_id'].toString();
      // check task validity for moving in sprint
      const checkTaskIsAllowedToMove = this.checkTaskIsAllowedToAddInSprint(taskDetail);

      // if any error found in task validity checking return it
      if (checkTaskIsAllowedToMove instanceof SprintErrorResponseItem) {
        return checkTaskIsAllowedToMove;
      }

      // find current stage id where task is already added
      const currentStageId = sprintDetails.stages.find(stage => {
        return stage.tasks.some(task => task.taskId.toString() === model.taskId);
      }).id;

      // loop over stages
      sprintDetails.stages.forEach((stage) => {
        // remove task from current stage and minus estimation time from total stage estimation time
        if (stage.id === currentStageId) {
          stage.totalEstimation -= taskDetail.estimatedTime;
          stage.tasks = stage.tasks.filter(task => task.taskId.toString() !== taskDetail.id);
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

      // update task status
      // will be done later

      await session.commitTransaction();
      session.endSession();

      const sprint = await this.getSprintDetails(model.sprintId, commonPopulationForSprint, detailedFiledSelection);
      return this.prepareSprintVm(sprint);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * update member working capacity for sprint
   * @param model: UpdateSprintMemberWorkingCapacity[]
   */
  public async updateSprintMemberWorkingCapacity(model: UpdateSprintMemberWorkingCapacity) {
    // check capacity object is present or not
    if (!model.capacity || !model.capacity.length) {
      throw new BadRequestException('please add at least one member capacity');
    }

    // get project details
    const projectDetails = await this.getProjectDetails(model.projectId);

    // check if all members are part of the project
    const everyMemberThere = model.capacity.every(member => projectDetails.members.some(proejctMember => proejctMember.userId === member.memberId));
    if (!everyMemberThere) {
      throw new BadRequestException('One of member is not found in Project!');
    }

    // get sprint details by id
    const sprintDetails = await this.getSprintDetails(model.sprintId);

    // check if all members are part of the sprint
    const everyMemberThereInSprint = model.capacity.every(member => sprintDetails.membersCapacity.some(proejctMember => proejctMember.userId === member.memberId));
    if (!everyMemberThereInSprint) {
      throw new BadRequestException('One of member is not member in Sprint!');
    }

    // total working capacity holder variable
    let totalWorkingCapacity = 0;

    // update members capacity in sprint details model
    sprintDetails.membersCapacity.forEach(sprintMember => {
      const indexOfMemberInRequestedModal = model.capacity.findIndex(capacity => capacity.memberId === sprintMember.userId);

      if (indexOfMemberInRequestedModal > -1) {
        sprintMember.workingCapacityPerDay = stringToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacityPerDayReadable);
      }
      totalWorkingCapacity += sprintMember.workingCapacityPerDay;
    });

    const session = await this._sprintModel.db.startSession();
    session.startTransaction();
    try {
      // update object for sprint member capacity
      const updateObject = { $set: { membersCapacity: sprintDetails.membersCapacity } };
      // update sprint in database
      const updateResult = await this._sprintModel.updateOne({ _id: model.sprintId }, updateObject, session);
      await session.commitTransaction();
      session.endSession();

      // return sprint details
      const sprint = await this.getSprintDetails(model.sprintId, commonPopulationForSprint, commonFieldSelection);
      return this.prepareSprintVm(sprint);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * publish sprint
   * this will publish a requested sprint
   * check the basic validation like valid sprint id, valid project id, valid member
   * then advance validations like start date can not be before today, end date cannot be before today, published date can not be in between sprint start and end date
   * update sprint status to in progress and send mail to all the sprint members
   * @param model: PublishSprintModel
   */
  public async publishSprint(model: PublishSprintModel) {
    const projectDetails = await this.getProjectDetails(model.projectId);
    const sprintDetails = await this.getSprintDetails(model.sprintId);

    // validation
    const sprintStartDate = moment(sprintDetails.startedAt);
    const sprintEndDate = moment(sprintDetails.endAt);

    // sprint start date is before today
    if (sprintStartDate.isBefore(moment(), 'd')) {
      throw new BadRequestException('Sprint start date is before today!');
    }

    // sprint end date can not be before today
    if (sprintEndDate.isBefore(moment(), 'd')) {
      throw new BadRequestException('Sprint end date is passed!');
    }

    // update sprint status
    const updateSprintObject = {
      status: SprintStatusEnum.inProgress, updatedAt: new Date()
    };

    // send mail

    try {
      // update sprint
      await this._sprintModel.updateOne({ _id: model.sprintId }, { sprintStatus: updateSprintObject });
      // return sprint details
      return 'Sprint Published Successfully';
    } catch (e) {
      throw e;
    }
  }

  /**
   * get un-published sprint details
   * sprint which is not published yet and it's end date is after today
   * @param projectId
   * @returns {Promise<DocumentQuery<(Sprint & Document)[], Sprint & Document> & {}>}
   */
  public async getUnPublishSprint(projectId: string) {
    const projectDetails = await this.getProjectDetails(projectId);

    // create query object for sprint
    const queryObjectForUnPublishedSprint = {
      isDeleted: false,
      projectId: projectId,
      endAt: { $gt: moment().startOf('d').toDate() },
      'sprintStatus.status': { $in: [undefined, null] }
    };

    // return founded sprint
    return this._sprintModel.findOne(queryObjectForUnPublishedSprint).populate(commonPopulationForSprint).sort('-createdAt');
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
      sprintError.id = task.id;

      // check task assignee
      if (!task.assigneeId) {
        sprintError.reason = SprintErrorEnum.taskNoAssignee;
      }

      // check task estimation
      if (!task.estimatedTime) {
        sprintError.reason = SprintErrorEnum.taskNoEstimate;
      }

      // commented out because currently we ony support single sprint
      // check if task is already in sprint
      // if (task.sprintId) {
      //   sprintError.reason = SprintErrorEnum.alreadyInSprint;
      // }

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
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Project Not Found');
    }
    const projectDetails: Project = await this._projectModel.findById(id).select('members settings createdBy updatedBy').lean().exec();

    if (!projectDetails) {
      throw new NotFoundException('Project Not Found');
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
   * @param populate: population array
   * @param select: filed selection string
   */
  private async getSprintDetails(id: string, populate: any[] = [], select: string = detailedFiledSelection): Promise<Sprint> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Sprint Not Found');
    }
    const sprintDetails: Sprint = await this._sprintModel.findOne({ _id: id, isDeleted: false })
      .populate(populate)
      .select(select)
      .lean()
      .exec();

    if (!sprintDetails) {
      throw new NotFoundException('Sprint Not Found');
    }
    return sprintDetails;
  }

  /**
   * convert sprint object to it's view model
   * @param sprint
   * @returns {Sprint}
   */
  private prepareSprintVm(sprint: Sprint): Sprint {
    sprint.id = sprint['_id'];
    // convert total capacity in readable format
    sprint.totalCapacityReadable = secondsToString(sprint.totalCapacity);

    // convert estimation time in readable format
    sprint.totalEstimationReadable = secondsToString(sprint.totalEstimation);

    // calculate total remaining capacity
    sprint.totalRemainingCapacity = sprint.totalCapacity - sprint.totalEstimation || 0;
    sprint.totalRemainingCapacityReadable = secondsToString(sprint.totalRemainingCapacity);

    // convert total logged time in readable format
    sprint.totalLoggedTimeReadable = secondsToString(sprint.totalLoggedTime);

    // calculate total remaining time
    sprint.totalRemainingTime = sprint.totalEstimation - sprint.totalLoggedTime || 0;
    sprint.totalRemainingTimeReadable = secondsToString(sprint.totalRemainingTime);

    // calculate progress
    sprint.progress = Number(((100 * sprint.totalLoggedTime) / sprint.totalEstimation).toFixed(2)) || 0;

    // loop over stages and convert total estimation time to readable format
    if (sprint.stages) {
      sprint.stages.forEach(stage => {
        stage.totalEstimationReadable = secondsToString(stage.totalEstimation);
      });
    }

    // loop over sprint members and convert working capacity to readable format
    if (sprint.membersCapacity) {
      sprint.membersCapacity.forEach(member => {
        member.workingCapacityPerDayReadable = secondsToString(member.workingCapacityPerDay);
      });
      return sprint;
    }
  }

}
