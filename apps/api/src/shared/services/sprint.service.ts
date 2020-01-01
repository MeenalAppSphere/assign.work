import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AddTaskRemoveTaskToSprintResponseModel,
  AddTaskToSprintModel,
  BasePaginatedResponse,
  CreateSprintModel,
  DbCollection,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel,
  MoveTaskToStage,
  Project,
  PublishSprintModel,
  RemoveTaskFromSprintModel,
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
  UpdateSprintModel,
  User
} from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';
import { hourToSeconds, secondsToHours, secondsToString } from '../helpers/helpers';
import { DEFAULT_DECIMAL_PLACES } from '../helpers/defaultValueConstant';

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
  select: 'name displayName sprintId priority taskType status assigneeId estimatedTime remainingTime overLoggedTime totalLoggedTime',
  justOne: true,
  populate: {
    path: 'assignee',
    select: 'emailId userName firstName lastName profilePic -_id',
    justOne: true
  }
}];

const commonFieldSelection = 'name startedAt endAt goal sprintStatus membersCapacity totalCapacity totalEstimation totalLoggedTime totalOverLoggedTime createdById updatedById';
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
      sprint = this.prepareSprintVm(sprint, projectDetails);
    });
    return result;
  }

  /**
   * get sprint by sprint id
   * model: GetSprintByIdRequestModel
   */
  public async getSprintById(model: GetSprintByIdRequestModel, onlyPublished: boolean = false) {
    const projectDetails = await this.getProjectDetails(model.projectId);

    const filter = {
      _id: model.sprintId,
      projectId: model.projectId,
      isDeleted: false
    };

    if (onlyPublished) {
      filter['sprintStatus.status'] = SprintStatusEnum.inProgress;
    }

    let sprint = await this._sprintModel.findOne(filter).populate(detailedPopulationForSprint).select(detailedFiledSelection).lean().exec();
    sprint = this.prepareSprintVm(sprint, projectDetails);

    // prepare tasks details object only for stage[0], because this is unpublished sprint and in when sprint is not published at that time
    // tasks is only added in only first stage means stage[0]
    sprint.stages[0].tasks.forEach(obj => {
      obj.task = this.parseTaskObjectForUi(obj.task, projectDetails);
    });

    return sprint;
  }

  /**
   * get only published sprint
   * @param model
   */
  public async getPublishedSprintById(model: GetSprintByIdRequestModel) {
    return this.getSprintById(model, true);
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

    // perform common validations
    this.commonSprintValidator(model.sprint);
    // endregion

    // get project details and check if current user is member of project
    const projectDetails = await this.getProjectDetails(model.sprint.projectId);

    // check if project have stages
    if (!projectDetails.settings.stages.length) {
      throw new BadRequestException('No stages found in Project please create at least one stage');
    }

    // sprint unique name validation per project
    const isSprintNameAlreadyExits = await this._sprintModel.find({
      name: { $regex: new RegExp(`^${model.sprint.name}$`), $options: 'i' },
      isDeleted: false,
      projectId: model.sprint.projectId
    }).select('name').countDocuments();

    if (isSprintNameAlreadyExits > 0) {
      throw new BadRequestException('Sprint name already exits');
    }

    // add all project collaborators as sprint member and add their's work capacity to total capacity
    model.sprint.membersCapacity = [];
    model.sprint.totalCapacity = 0;

    // add only those members who accepted invitation of project means active collaborator of project
    projectDetails.members.filter(member => member.isInviteAccepted).forEach(member => {
      model.sprint.membersCapacity.push({
        userId: member.userId,
        workingCapacity: member.workingCapacity,
        workingCapacityPerDay: member.workingCapacityPerDay,
        workingDays: member.workingDays
      });
      model.sprint.totalCapacity += Number(member.workingCapacity);
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
      return this.prepareSprintVm(sprint, projectDetails);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * update sprint
   * @param model: UpdateSprintModel
   */
  public async updateSprint(model: UpdateSprintModel) {
    // basic validation
    if (!model.sprint) {
      throw new BadRequestException('invalid request sprint details missing');
    }

    if (!model.sprint.id) {
      throw new BadRequestException('Sprint not found');
    }

    // perform common validations
    this.commonSprintValidator(model.sprint);

    // get project details
    const projectDetails = await this.getProjectDetails(model.sprint.projectId);

    // check if project have stages
    if (!projectDetails.settings.stages.length) {
      throw new BadRequestException('No stages found in Project please create at least one stage');
    }

    // sprint unique name validation per project
    const isSprintNameAlreadyExits = await this._sprintModel.find({
      name: { $regex: new RegExp(`^${model.sprint.name}$`), $options: 'i' },
      _id: { $ne: model.sprint.id },
      isDeleted: false,
      projectId: model.sprint.projectId

    }).select('name').countDocuments();

    if (isSprintNameAlreadyExits > 0) {
      throw new BadRequestException('Sprint name already exits');
    }

    const sprintDetails: Sprint = await this._sprintModel
      .findOne({ _id: model.sprint.id, isDeleted: false })
      .select('name startedAt endAt goal sprintStatus')
      .lean()
      .exec();

    if (!sprintDetails) {
      throw new BadRequestException('Sprint not found!');
    }

    if (sprintDetails.sprintStatus) {
      let msgStatus = '';
      // switch over sprint status
      switch (sprintDetails.sprintStatus.status) {
        case SprintStatusEnum.inProgress:
          msgStatus = 'Published';
          break;
        case SprintStatusEnum.closed:
          msgStatus = 'Closed';
          break;
        case SprintStatusEnum.completed:
          msgStatus = 'Completed';
      }

      throw new BadRequestException(`Sprint is already ${msgStatus}! You can not update it`);
    }

    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      await this._sprintModel.updateOne({ _id: model.sprint.id }, {
        $set: {
          name: model.sprint.name, goal: model.sprint.goal, startedAt: model.sprint.startedAt, endAt: model.sprint.endAt
        }
      }, { session });
      await session.commitTransaction();
      session.endSession();

      const sprint = await this.getSprintDetails(model.sprint.id, commonPopulationForSprint, commonFieldSelection);
      return this.prepareSprintVm(sprint, projectDetails);
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
  public async addTaskToSprint(model: AddTaskToSprintModel): Promise<AddTaskRemoveTaskToSprintResponseModel | SprintErrorResponse> {
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

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

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
              workingCapacity: 0,
              alreadyLoggedTime: 0
            });
          }
        }
      });

      // check if we found some errors while checking tasks return that error
      if (sprintError.tasksErrors.length) {
        return sprintError;
      }

      // get sprint count days from sprint start date and end date
      const sprintDaysCount = moment(sprintDetails.endAt).diff(sprintDetails.startedAt, 'd') || 1;

      // fill member working capacity from sprint details in assignee task map holder variable
      sprintDetails.membersCapacity.forEach(member => {
        // find assignee index and update it's working capacity from sprint details
        const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === member.userId);

        if (assigneeIndex > -1) {
          taskAssigneeMap[assigneeIndex].workingCapacity = Number(member.workingCapacity);
        }
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

        // region check exact capacity for sprint commented out for version 2
        // if assignee already logged time + assignee's total estimation from above sprint tasks
        // is greater
        // assignee working limit per sprint
        // return error ( member working capacity exceed )

        // ((taskAssigneeMap[i].alreadyLoggedTime + taskAssigneeMap[i].totalEstimation) > ((taskAssigneeMap[i].workingCapacity) * sprintDaysCount))

        // if ((taskAssigneeMap[i].alreadyLoggedTime + taskAssigneeMap[i].totalEstimation) > hourToSeconds(taskAssigneeMap[i].workingCapacity)) {
        //   sprintError.membersErrors.push({
        //     id: taskAssigneeMap[i].memberId,
        //     reason: SprintErrorEnum.memberCapacityExceed
        //   });
        // }
        // endregion

      }

      // check if we found some errors while checking users availability
      if (sprintError.membersErrors.length) {
        return sprintError;
      }

      // now all validations have been completed add task to sprint

      for (let i = 0; i < taskDetails.length; i++) {

        // check if task is already in any of sprint stage
        const taskIsAlreadyInSprint = sprintDetails.stages.some(stage => {
          return stage.tasks.some(task => task.taskId === taskDetails[i].id);
        });

        // if task is already in sprint then continue the loop to next iteration
        if (taskIsAlreadyInSprint) {
          continue;
        }

        // add task estimation to sprint total estimation
        sprintDetails.totalEstimation += taskDetails[i].estimatedTime;

        // add task estimation to stage total estimation
        sprintDetails.stages[0].totalEstimation += taskDetails[i].estimatedTime;
        // add task to stage
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

      // update task and set sprint id
      for (let i = 0; i < taskDetails.length; i++) {
        await this._taskModel.updateOne({ _id: taskDetails[i].id }, { sprintId: model.sprintId }, { session });
      }

      await session.commitTransaction();
      session.endSession();

      // const sprint = await this.getSprintDetails(model.sprintId, commonPopulationForSprint, commonFieldSelection);
      // return this.prepareSprintVm(sprint);
      return {
        totalCapacity: sprintDetails.totalCapacity,
        totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
        totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
        totalRemainingCapacityReadable: secondsToString(sprintDetails.totalRemainingCapacity),
        totalEstimation: sprintDetails.totalEstimation,
        totalEstimationReadable: secondsToString(sprintDetails.totalEstimation),
        tasks: model.tasks
      };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }

  }

  /**
   * remove task from sprint
   * get all tasks details, then minus theirs estimation from sprint total estimation
   * filter it out from stage [0]
   * update task and remove sprint Id from that task
   * update sprint and return removed task id Array
   * @param model: RemoveTaskFromSprintModel
   * @return {Promise<void>}
   */
  public async removeTaskFromSprint(model: RemoveTaskFromSprintModel): Promise<AddTaskRemoveTaskToSprintResponseModel> {
    // region basic validation

    // tasks array
    if (!model.tasks || !model.tasks.length) {
      throw new BadRequestException('Please add at least one task for remove...');
    }
    // endregion

    // start the session
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      // get project details by project id
      const projectDetails = await this.getProjectDetails(model.projectId);

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      // get all tasks details from given tasks array
      const taskDetails: Task[] = await this._taskModel.find({
        projectId: this.toObjectId(model.projectId),
        sprintId: this.toObjectId(model.sprintId),
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

      // loop over all the tasks and minus estimation time from sprint total estimation
      // update task in db set sprintId to null
      for (let i = 0; i < taskDetails.length; i++) {
        const task = taskDetails[i];
        task.id = task['_id'];

        // minus task estimation from stages[0].totalEstimation ( first stage )
        sprintDetails.stages[0].totalEstimation -= task.estimatedTime;
        sprintDetails.stages[0].tasks = sprintDetails.stages[0].tasks.filter(sprintTask => sprintTask.taskId.toString() !== task.id.toString());

        // minus task estimation from sprint total estimation
        sprintDetails.totalEstimation -= task.estimatedTime;

        // update task model
        await this._taskModel.updateOne({ _id: task.id }, { sprintId: null }, { session });
      }

      // set total remaining capacity by dividing sprint members totalCapacity - totalEstimation
      sprintDetails.totalRemainingCapacity = sprintDetails.totalCapacity - sprintDetails.totalEstimation;
      sprintDetails.totalRemainingTime = sprintDetails.totalEstimation - sprintDetails.totalLoggedTime;

      // update sprint
      await this.update(model.sprintId, sprintDetails, session);
      await session.commitTransaction();
      session.endSession();

      // return add deleted tasks id
      return {
        totalCapacity: sprintDetails.totalCapacity,
        totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
        totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
        totalRemainingCapacityReadable: secondsToString(sprintDetails.totalRemainingCapacity),
        totalEstimation: sprintDetails.totalEstimation,
        totalEstimationReadable: secondsToString(sprintDetails.totalEstimation),
        tasks: model.tasks
      };
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
      return this.prepareSprintVm(sprint, projectDetails);
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
    const everyMemberThere = model.capacity.every(member => projectDetails.members.some(proejctMember => {
      return proejctMember.userId === member.memberId && proejctMember.isInviteAccepted;
    }));
    if (!everyMemberThere) {
      throw new BadRequestException('One of member is not found in Project!');
    }

    // valid working days
    // const validWorkingDays = model.capacity.every(ddt => validWorkingDaysChecker(ddt.workingDays));
    //
    // if (!validWorkingDays) {
    //   throw new BadRequestException('One of Collaborator working days are invalid');
    // }

    // get sprint details by id
    const sprintDetails = await this.getSprintDetails(model.sprintId);

    if (sprintDetails.sprintStatus) {
      let msgStatus = '';
      // switch over sprint status
      switch (sprintDetails.sprintStatus.status) {
        case SprintStatusEnum.inProgress:
          msgStatus = 'Published';
          break;
        case SprintStatusEnum.closed:
          msgStatus = 'Closed';
          break;
        case SprintStatusEnum.completed:
          msgStatus = 'Completed';
      }

      throw new BadRequestException(`Sprint is already ${msgStatus}! You can not change it's Capacity`);
    }

    // check if all members are part of the sprint
    const everyMemberThereInSprint = model.capacity.every(member => sprintDetails.membersCapacity.some(proejctMember => proejctMember.userId === member.memberId));
    if (!everyMemberThereInSprint) {
      throw new BadRequestException('One of member is not member in Sprint!');
    }

    // crete db session and start transaction
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      // total working capacity holder variable
      let totalWorkingCapacity = 0;

      // update members capacity in sprint details model
      sprintDetails.membersCapacity.forEach(sprintMember => {
        const indexOfMemberInRequestedModal = model.capacity.findIndex(capacity => capacity.memberId === sprintMember.userId);

        if (indexOfMemberInRequestedModal > -1) {
          // convert member capacity hours to seconds
          sprintMember.workingCapacity = hourToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacity);
          // sprintMember.workingCapacityPerDay = hourToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacityPerDay);
          // sprintMember.workingDays = model.capacity[indexOfMemberInRequestedModal].workingDays;
        }
        totalWorkingCapacity += sprintMember.workingCapacity;
      });

      sprintDetails.totalRemainingCapacity = totalWorkingCapacity - sprintDetails.totalEstimation;

      // update object for sprint member capacity
      const updateObject = {
        $set: {
          membersCapacity: sprintDetails.membersCapacity,
          totalCapacity: totalWorkingCapacity,
          totalRemainingCapacity: sprintDetails.totalRemainingCapacity
        }
      };
      // update sprint in database
      await this._sprintModel.updateOne({ _id: model.sprintId }, updateObject, { session });
      await session.commitTransaction();
      session.endSession();

      // return sprint details
      const sprint = await this.getSprintDetails(model.sprintId, commonPopulationForSprint, commonFieldSelection);
      return this.prepareSprintVm(sprint, projectDetails);
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

    // find out newly created stages from project details
    const newStagesFromProject = projectDetails.settings.stages.filter(stage => {
      return !sprintDetails.stages.some(sprintStage => sprintStage.id === stage.id);
    });

    const newStagesModels: SprintStage[] = [];

    // create new stages model for adding in db
    newStagesFromProject.forEach(newStage => {
      // create sprint model
      const sprintStage = new SprintStage();
      sprintStage.id = newStage.id;
      sprintStage.status = [];
      sprintStage.tasks = [];
      sprintStage.totalEstimation = 0;

      newStagesModels.push(sprintStage);
    });

    // update sprint in db
    const updateSprintObject = {
      sprintStatus: {
        status: SprintStatusEnum.inProgress, updatedAt: new Date()
      },
      $push: { stages: newStagesModels }
    };

    // send mail
    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      // update sprint in db
      await this.update(model.sprintId, updateSprintObject, session);

      // update project and set published sprint as active sprint in project
      await this._projectModel.updateOne({ _id: model.projectId }, { $set: { sprintId: model.sprintId } }, { session });
      await session.commitTransaction();
      session.endSession();
      return 'Sprint Published Successfully';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
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
    let sprint: Sprint = await this._sprintModel.findOne(queryObjectForUnPublishedSprint).populate(detailedPopulationForSprint).sort('-createdAt').lean();

    if (!sprint) {
      return 'No Unpublished Sprint Found';
    }

    // prepare sprint vm model
    sprint = this.prepareSprintVm(sprint, projectDetails);

    // prepare tasks details object only for stage[0], because this is unpublished sprint and in when sprint is not published at that time
    // tasks is only added in only first stage means stage[0]
    sprint.stages[0].tasks.forEach(obj => {
      obj.task = this.parseTaskObjectForUi(obj.task, projectDetails);
    });

    return sprint;
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

      // check if task is already in sprint
      if (task.sprintId) {
        sprintError.reason = SprintErrorEnum.alreadyInSprint;
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
  public async getSprintDetails(id: string, populate: any[] = [], select: string = detailedFiledSelection): Promise<Sprint> {
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
   * @param projectDetails
   */
  private prepareSprintVm(sprint: Sprint, projectDetails: Project): Sprint {
    if (!sprint) {
      return sprint;
    }

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

    // convert total over logged time in readable format
    sprint.totalOverLoggedTimeReadable = secondsToString(sprint.totalOverLoggedTime || 0);

    // calculate progress
    sprint.progress = Number(((100 * sprint.totalLoggedTime) / sprint.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;
    if (sprint.progress > 100) {
      sprint.progress = 100;

      // set total remaining time to zero
      sprint.totalRemainingTime = 0;
      sprint.totalRemainingTimeReadable = secondsToString(sprint.totalRemainingTime);
    } else {
      // calculate total remaining time
      sprint.totalRemainingTime = sprint.totalEstimation - sprint.totalLoggedTime || 0;
      sprint.totalRemainingTimeReadable = secondsToString(sprint.totalRemainingTime);
    }

    // calculate over progress
    sprint.overProgress = Number(((100 * sprint.totalOverLoggedTime) / sprint.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;

    // loop over stages and convert total estimation time to readable format
    if (sprint.stages) {
      sprint.stages.forEach(stage => {
        stage.stage = projectDetails.settings.stages.find(st => st.id === stage.id);
        stage.totalEstimationReadable = secondsToString(stage.totalEstimation);
      });
    }

    // seconds to hour for ui
    sprint.totalCapacity = secondsToHours(sprint.totalCapacity);
    sprint.totalEstimation = secondsToHours(sprint.totalEstimation);
    sprint.totalRemainingCapacity = secondsToHours(sprint.totalRemainingCapacity);
    sprint.totalLoggedTime = secondsToHours(sprint.totalLoggedTime);
    sprint.totalOverLoggedTime = secondsToHours(sprint.totalOverLoggedTime || 0);
    sprint.totalRemainingTime = secondsToHours(sprint.totalRemainingTime);

    // loop over sprint members and convert working capacity to readable format
    if (sprint.membersCapacity) {
      sprint.membersCapacity.forEach(member => {
        // convert capacity to hours again
        member.workingCapacity = secondsToHours(member.workingCapacity);
        member.workingCapacityPerDay = secondsToHours(member.workingCapacityPerDay);
        // member.workingCapacityPerDayReadable = secondsToString(member.workingCapacityPerDay);
      });
      return sprint;
    }
  }

  /**
   * parse task object, convert seconds to readable string, fill task type, priority, status etc..
   * @param task : Task
   * @param projectDetails: Project
   */
  private parseTaskObjectForUi(task: Task, projectDetails: Project) {
    task.id = task['_id'];

    task.taskType = projectDetails.settings.taskTypes.find(t => t.id === task.taskType);
    task.priority = projectDetails.settings.priorities.find(t => t.id === task.priority);
    task.status = projectDetails.settings.status.find(t => t.id === task.status);
    task.isSelected = !!task.sprintId;

    // convert all time keys to string from seconds
    task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime || 0);
    task.estimatedTimeReadable = secondsToString(task.estimatedTime || 0);
    task.remainingTimeReadable = secondsToString(task.remainingTime || 0);
    task.overLoggedTimeReadable = secondsToString(task.overLoggedTime || 0);

    if (task.attachmentsDetails) {
      task.attachmentsDetails.forEach(attachment => {
        attachment.id = attachment['_id'];
      });
    }
    return task;
  }

  /**
   * common sprint related validations
   * check name, started At, end At, goal present or not
   * check sprint start date is not before today
   * check sprint end date is not before start date
   * @param sprint
   */
  private commonSprintValidator(sprint: Sprint) {
    // sprint name
    if (!sprint.name) {
      throw new BadRequestException('Sprint Name is compulsory');
    }

    // sprint goal
    if (!sprint.goal) {
      throw new BadRequestException('Sprint goal is required');
    }

    // sprint started at
    if (!sprint.startedAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    // sprint end at
    if (!sprint.endAt) {
      throw new BadRequestException('Please select Sprint End Date');
    }

    // started date can not be before today
    const isStartDateBeforeToday = moment(sprint.startedAt).isBefore(moment().startOf('d'));
    if (isStartDateBeforeToday) {
      throw new BadRequestException('Sprint Started date can not be Before Today');
    }

    // end date can not be before start date
    const isEndDateBeforeTaskStartDate = moment(sprint.endAt).isBefore(sprint.startedAt);
    if (isEndDateBeforeTaskStartDate) {
      throw new BadRequestException('Sprint End Date can not be before Sprint Start Date');
    }
  }

}
