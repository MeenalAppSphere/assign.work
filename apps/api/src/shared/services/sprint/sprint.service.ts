import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  AddTaskRemoveTaskToSprintResponseModel,
  AssignTasksToSprintModel,
  BasePaginatedResponse,
  CloseSprintModel,
  CreateSprintModel,
  DbCollection,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel,
  MoveTaskToStage,
  PublishSprintModel,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintColumn,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintErrorResponseItem,
  SprintStatusEnum,
  Task,
  TaskAssigneeMap,
  UpdateSprintMemberWorkingCapacity,
  UpdateSprintModel
} from '@aavantan-app/models';
import { ClientSession, Document, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from '../general.service';
import * as moment from 'moment';
import {
  BadRequest,
  generateUtcDate,
  hourToSeconds,
  secondsToString,
  validWorkingDaysChecker
} from '../../helpers/helpers';
import { TaskService } from '../task.service';
import { ModuleRef } from '@nestjs/core';
import { SprintUtilityService } from './sprint.utility.service';
import { TaskHistoryService } from '../task-history.service';
import { TaskTimeLogService } from '../task-time-log.service';
import { ProjectService } from '../project/project.service';
import { BoardUtilityService } from '../board/board.utility.service';

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
  path: 'columns.tasks.addedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'columns.tasks.task',
  select: 'name displayName sprintId priority taskType status assigneeId estimatedTime remainingTime overLoggedTime totalLoggedTime',
  justOne: true,
  populate: {
    path: 'assignee',
    select: 'emailId userName firstName lastName profilePic -_id',
    justOne: true
  }
}];

const commonFieldSelection = 'name startedAt endAt goal sprintStatus membersCapacity totalCapacity totalEstimation totalLoggedTime totalOverLoggedTime createdById updatedById';
const detailedFiledSelection = `${commonFieldSelection} columns `;

@Injectable()
export class SprintService extends BaseService<Sprint & Document> implements OnModuleInit {

  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _taskHistoryService: TaskHistoryService;
  private _taskTimeLogService: TaskTimeLogService;

  private _sprintUtilityService: SprintUtilityService;
  private _boardUtilityService: BoardUtilityService;

  constructor(
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    private _generalService: GeneralService, private _moduleRef: ModuleRef
  ) {
    super(_sprintModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');

    this._sprintUtilityService = new SprintUtilityService(this._sprintModel);
    this._boardUtilityService = new BoardUtilityService();
  }

  /**
   * get all sprints
   * with pagination
   * @param model
   */
  public async getAllSprints(model: GetAllSprintRequestModel) {
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);

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
      sprint = this._sprintUtilityService.prepareSprintVm(sprint);
    });
    return result;
  }

  /**
   * get sprint by sprint id
   * model: GetSprintByIdRequestModel
   */
  public async getSprintById(model: GetSprintByIdRequestModel, onlyPublished: boolean = false) {
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);

    const filter = {
      _id: model.sprintId,
      projectId: model.projectId,
      isDeleted: false
    };

    if (onlyPublished) {
      filter['sprintStatus.status'] = SprintStatusEnum.inProgress;
    }

    let sprint = await this._sprintModel.findOne(filter).populate(detailedPopulationForSprint).select(detailedFiledSelection).lean().exec();
    sprint = this._sprintUtilityService.prepareSprintVm(sprint);

    // prepare tasks details object only for stage[0], because this is unpublished sprint and in when sprint is not published at that time
    // tasks is only added in only first stage means stage[0]
    sprint.stages[0].tasks.forEach(obj => {
      obj.task = this._sprintUtilityService.parseTaskObjectForUi(obj.task, projectDetails);
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

    const newSprint = await this.withRetrySession(async (session: ClientSession) => {
      // perform common validations
      this._sprintUtilityService.commonSprintValidator(model.sprint);

      // get project details and check if current user is member of project
      const projectDetails = await this._projectService.getProjectDetails(model.sprint.projectId, true);

      if (!projectDetails.activeBoard) {
        BadRequest('Active board not found, Sprint can not be created');
      }

      // sprint duplicate name validation per project
      if (await this.isDuplicate(model.sprint)) {
        BadRequest('Duplicate Sprint Name is not allowed');
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
      model.sprint.columns = [];

      projectDetails.activeBoard.columns.forEach(column => {
        const sprintColumn = new SprintColumn();
        sprintColumn.name = column.headerStatus.name;
        sprintColumn.id = column.headerStatusId;
        sprintColumn.status = [];
        sprintColumn.tasks = [];
        sprintColumn.totalEstimation = 0;

        model.sprint.columns.push(sprintColumn);
      });

      // set sprint created by id
      model.sprint.createdById = this._generalService.userId;

      return await this.create([model.sprint], session);
    });

    const sprint = await this.getSprintDetails(newSprint[0].id, commonPopulationForSprint, commonFieldSelection);
    return this._sprintUtilityService.prepareSprintVm(sprint);
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
    this._sprintUtilityService.commonSprintValidator(model.sprint);

    // get project details
    const projectDetails = await this._projectService.getProjectDetails(model.sprint.projectId);

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

    const session = await this.startSession();

    try {
      await this._sprintModel.updateOne({ _id: model.sprint.id }, {
        $set: {
          name: model.sprint.name, goal: model.sprint.goal, startedAt: model.sprint.startedAt, endAt: model.sprint.endAt
        }
      }, { session });
      await this.commitTransaction(session);

      const sprint = await this.getSprintDetails(model.sprint.id, commonPopulationForSprint, commonFieldSelection);
      return this._sprintUtilityService.prepareSprintVm(sprint);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * assign tasks to a sprint
   * @param model: AssignTasksToSprintModel
   */
  public async assignTasksToSprint(model: AssignTasksToSprintModel): Promise<AddTaskRemoveTaskToSprintResponseModel | SprintErrorResponse> {
    return await this.withRetrySession(async (session: ClientSession) => {
      const project = await this._projectService.getProjectDetails(model.projectId, true);

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      // gather all task from all columns to this variable
      const allColumnsTasksIds: Array<string | Types.ObjectId> = [];
      sprintDetails.columns.forEach(column => {
        allColumnsTasksIds.push(...column.tasks.map(task => task.taskId.toString()));
      });

      // get all task that need to be added to sprint
      let newTasks: Array<string | Types.ObjectId> = model.tasks.filter(task => {
        return !allColumnsTasksIds.includes(task);
      });

      // get all removed task from sprint
      let removedTasks: Array<string | Types.ObjectId> = allColumnsTasksIds.filter(task => {
        return !model.tasks.includes(task as string);
      });

      if (!newTasks.length && !removedTasks.length) {
        throw new BadRequestException('Oops It\'s seems that your sprint is empty, please assign a new item to save a sprint');
      }

      // region remove task from sprint
      // check if any task is removed or not
      if (removedTasks.length) {
        removedTasks = removedTasks.map(task => this.toObjectId(task as string));
        const removedTasksDetails = await this._taskService.dbModel.aggregate([
          {
            $match: {
              projectId: this.toObjectId(model.projectId),
              _id: { $in: removedTasks },
              isDeleted: false,
              sprintId: this.toObjectId(model.sprintId)
            }
          }
        ]);

        if (removedTasksDetails.length !== removedTasks.length) {
          throw new BadRequestException('one of tasks not found');
        }

        // loop over all the tasks and minus estimation time from sprint total estimation
        // update task in db set sprintId to null
        for (let i = 0; i < removedTasksDetails.length; i++) {
          const task = removedTasksDetails[i];
          const columnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, task.statusId);
          task.id = task['_id'];

          // minus task estimation from stages[0].totalEstimation ( first stage )
          sprintDetails.columns[columnIndex].totalEstimation -= task.estimatedTime;

          // remove task from stage
          sprintDetails.columns[columnIndex].tasks = sprintDetails.columns[columnIndex].tasks.filter(sprintTask => sprintTask.taskId.toString() !== task.id.toString());

          // minus task estimation from sprint total estimation
          sprintDetails.totalEstimation -= task.estimatedTime;
        }

      }
      // endregion

      // region add task to sprint
      if (newTasks.length) {
        newTasks = newTasks.map(task => this.toObjectId(task as string));
        // get all new tasks details
        const newTasksDetails = await this._taskService.dbModel.aggregate([
          {
            $match: {
              projectId: this.toObjectId(model.projectId),
              _id: { $in: newTasks },
              isDeleted: false
            }
          }
        ]);

        // check all tasks are available in database
        if (newTasksDetails.length < newTasks.length) {
          throw new BadRequestException('one of tasks not found');
        }

        // sprint error holder variable
        const sprintError: SprintErrorResponse = new SprintErrorResponse();
        sprintError.tasksErrors = [];
        sprintError.membersErrors = [];

        // task assignee details holder variable
        const taskAssigneeMap: TaskAssigneeMap[] = [];

        // loop over all the tasks
        newTasksDetails.forEach(task => {
          task.id = task['_id'];

          // check if task is allowed to added to sprint
          const checkTask = this._sprintUtilityService.checkTaskIsAllowedToAddInSprint(task);

          // check if error is returned from check task method
          if (checkTask instanceof SprintErrorResponseItem) {

            // add error to sprint task error holder
            sprintError.tasksErrors.push(checkTask);
          } else {
            // no error then get task assignee id and push it to the task assignee mapping holder variable
            const assigneeIndex = taskAssigneeMap.findIndex(assignee => assignee.memberId === task.assigneeId.toString());

            // if assignee already added then only update it's totalEstimation
            if (assigneeIndex > -1) {
              taskAssigneeMap[assigneeIndex].totalEstimation += task.estimatedTime;
            } else {
              // push assignee to assignee task map holder variable
              taskAssigneeMap.push({
                // convert object id to string
                memberId: (task.assigneeId as any).toString(),
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

        // region check exact capacity
        // if adjust hours not allowed then check for members capacity
        if (!model.adjustHoursAllowed) {

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

          //
          // // loop over assignee's and get their logged time
          for (let i = 0; i < taskAssigneeMap.length; i++) {
            // get all already logged time for current sprint time span, commented out for version 2

            // get assignee logged time for start and end date of sprint
            // const assigneeAlreadyLoggedForTheDate = await this._taskTimeLogService.find({
            // filter: {
            //   createdById: this.toObjectId(taskAssigneeMap[i].memberId),
            //   startedAt: { '$gte': moment(sprintDetails.startedAt).startOf('day').toDate() },
            //   endAt: { '$lt': moment(sprintDetails.endAt).endOf('day').toDate() },
            // });
            //
            // // calculate total of already logged time of assignee
            // if (assigneeAlreadyLoggedForTheDate && assigneeAlreadyLoggedForTheDate.length) {
            //   taskAssigneeMap[i].alreadyLoggedTime = assigneeAlreadyLoggedForTheDate.reduce((acc, cur) => {
            //     return acc + cur.loggedTime;
            //   }, 0);
            // }

            // if assignee already logged time + assignee's total estimation from above sprint tasks
            // is greater
            // assignee working limit per sprint
            // return error ( member working capacity exceed )

            if ((taskAssigneeMap[i].alreadyLoggedTime + taskAssigneeMap[i].totalEstimation) > hourToSeconds(taskAssigneeMap[i].workingCapacity)) {
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
        }
        // endregion

        // now all validations have been completed add task to sprint
        for (let i = 0; i < newTasksDetails.length; i++) {
          const columnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, newTasksDetails[i].statusId);

          // check if task is already in any of sprint stage
          const taskIsAlreadyInSprint = sprintDetails.columns.some(stage => {
            return stage.tasks.some(task => task.taskId === newTasksDetails[i].id);
          });

          // if task is already in sprint then continue the loop to next iteration
          if (taskIsAlreadyInSprint) {
            continue;
          }

          // add task estimation to sprint total estimation
          sprintDetails.totalEstimation += newTasksDetails[i].estimatedTime;

          // add task estimation to stage total estimation
          sprintDetails.columns[columnIndex].totalEstimation += newTasksDetails[i].estimatedTime;
          // add task to stage
          sprintDetails.columns[columnIndex].tasks.push({
            taskId: newTasksDetails[i].id,
            addedAt: generateUtcDate(),
            addedById: this._generalService.userId
          });
        }

        // set total remaining capacity by subtracting sprint members totalCapacity - totalEstimation
        sprintDetails.totalRemainingCapacity = sprintDetails.totalCapacity - sprintDetails.totalEstimation;
        sprintDetails.totalRemainingTime = sprintDetails.totalEstimation - sprintDetails.totalLoggedTime;
      }
      // endregion

      // update sprint
      await this.updateById(model.sprintId, {
        $set: {
          columns: sprintDetails.columns,
          totalEstimation: sprintDetails.totalEstimation,
          totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
          totalRemainingTime: sprintDetails.totalRemainingTime
        }
      }, session);

      // bulk update all removed tasks and set sprint id as null
      await this._taskService.bulkUpdate({ _id: { $in: removedTasks } }, { $set: { sprintId: null } }, session);

      // bulk update all added tasks and set sprint id
      await this._taskService.bulkUpdate({ _id: { $in: newTasks } }, { $set: { sprintId: model.sprintId } }, session);

      return {
        totalCapacity: sprintDetails.totalCapacity,
        totalCapacityReadable: secondsToString(sprintDetails.totalCapacity),
        totalRemainingCapacity: sprintDetails.totalRemainingCapacity,
        totalRemainingCapacityReadable: secondsToString(sprintDetails.totalRemainingCapacity),
        totalEstimation: sprintDetails.totalEstimation,
        totalEstimationReadable: secondsToString(sprintDetails.totalEstimation),
        tasks: model.tasks
      };
    });
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
    const session = await this.startSession();

    try {
      // get project details by project id
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      // get all tasks details from given tasks array
      const taskDetails: Task[] = await this._taskService.find({
        filter: {
          projectId: this.toObjectId(model.projectId),
          sprintId: this.toObjectId(model.sprintId),
          _id: { $in: model.tasks }
        },
        lean: true
      });

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

        // minus task estimation from columns[0].totalEstimation ( first stage )
        sprintDetails.columns[0].totalEstimation -= task.estimatedTime;
        sprintDetails.columns[0].tasks = sprintDetails.columns[0].tasks.filter(sprintTask => sprintTask.taskId.toString() !== task.id.toString());

        // minus task estimation from sprint total estimation
        sprintDetails.totalEstimation -= task.estimatedTime;

        // update task model
        await this._taskService.updateById(task.id, { sprintId: null }, session);
      }

      // set total remaining capacity by dividing sprint members totalCapacity - totalEstimation
      sprintDetails.totalRemainingCapacity = sprintDetails.totalCapacity - sprintDetails.totalEstimation;
      sprintDetails.totalRemainingTime = sprintDetails.totalEstimation - sprintDetails.totalLoggedTime;

      // update sprint
      await this.updateById(model.sprintId, sprintDetails, session);
      await this.commitTransaction(session);

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
      await this.abortTransaction(session);
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
    const session = await this.startSession();

    try {
      // get project details
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      // get sprint details from sprint id
      const sprintDetails = await this.getSprintDetails(model.sprintId);

      // check task is in sprint or not
      const isTaskInSprint = sprintDetails.columns.some(stage => stage.tasks.some(task => task.taskId.toString() === model.taskId));

      if (!isTaskInSprint) {
        throw new BadRequestException('This Task is not added in sprint');
      }

      // get all tasks details from given tasks array
      const taskDetail: Task = await this._taskService.findOne({
        filter: {
          projectId: this.toObjectId(model.projectId),
          _id: model.taskId
        },
        lean: true
      });

      if (!taskDetail) {
        throw new BadRequestException('Task not found');
      }

      // check task is in given sprint
      if (taskDetail.sprintId.toString() !== model.sprintId) {
        throw new BadRequestException('This Task is not added in sprint');
      }

      taskDetail.id = taskDetail['_id'].toString();
      // check task validity for moving in sprint
      const checkTaskIsAllowedToMove = this._sprintUtilityService.checkTaskIsAllowedToAddInSprint(taskDetail, true);

      // if any error found in task validity checking return it
      if (checkTaskIsAllowedToMove instanceof SprintErrorResponseItem) {
        return checkTaskIsAllowedToMove;
      }

      // find current stage id where task is already added
      const currentStageId = sprintDetails.columns.find(stage => {
        return stage.tasks.some(task => task.taskId.toString() === model.taskId);
      }).id;

      // loop over columns
      sprintDetails.columns.forEach((stage) => {
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
            addedAt: generateUtcDate(),
            updatedAt: generateUtcDate(),
            addedById: this._generalService.userId
          });
        }
      });

      // update sprint
      await this.updateById(model.sprintId, sprintDetails, session);

      // update task status
      // will be done later

      await this.commitTransaction(session);

      const sprint = await this.getSprintDetails(model.sprintId, detailedPopulationForSprint, detailedFiledSelection);
      return this._sprintUtilityService.prepareSprintVm(sprint);
    } catch (e) {
      await this.abortTransaction(session);
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
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);

    // check if all members are part of the project
    const everyMemberThere = model.capacity.every(member => projectDetails.members.some(proejctMember => {
      return proejctMember.userId === member.memberId && proejctMember.isInviteAccepted;
    }));
    if (!everyMemberThere) {
      throw new BadRequestException('One of member is not found in Project!');
    }

    // valid working days
    const validWorkingDays = model.capacity.every(ddt => validWorkingDaysChecker(ddt.workingDays));

    if (!validWorkingDays) {
      throw new BadRequestException('One of Collaborator working days are invalid');
    }

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
    const session = await this.startSession();

    try {
      // total working capacity holder variable
      let totalWorkingCapacity = 0;

      // update members capacity in sprint details model
      sprintDetails.membersCapacity.forEach(sprintMember => {
        const indexOfMemberInRequestedModal = model.capacity.findIndex(capacity => capacity.memberId === sprintMember.userId);

        if (indexOfMemberInRequestedModal > -1) {
          // convert member capacity hours to seconds
          sprintMember.workingCapacity = hourToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacity);
          sprintMember.workingCapacityPerDay = hourToSeconds(model.capacity[indexOfMemberInRequestedModal].workingCapacityPerDay);
          sprintMember.workingDays = model.capacity[indexOfMemberInRequestedModal].workingDays;
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
      await this.commitTransaction(session);

      // return sprint details
      const sprint = await this.getSprintDetails(model.sprintId, commonPopulationForSprint, commonFieldSelection);
      return this._sprintUtilityService.prepareSprintVm(sprint);
    } catch (e) {
      await this.abortTransaction(session);
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
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);
    const sprintDetails = await this.getSprintDetails(model.sprintId);

    // validations
    this._sprintUtilityService.publishSprintValidations(sprintDetails);

    // find out newly created columns from project details
    const newStagesFromProject = projectDetails.settings.stages.filter(stage => {
      return !sprintDetails.columns.some(sprintStage => sprintStage.id === stage.id);
    });

    const newStagesModels: SprintColumn[] = [];

    // create new stages model for adding in db
    newStagesFromProject.forEach(newStage => {
      // create sprint model
      const sprintStage = new SprintColumn();
      sprintStage.id = newStage.id;
      sprintStage.status = [];
      sprintStage.tasks = [];
      sprintStage.totalEstimation = 0;

      newStagesModels.push(sprintStage);
    });

    // update sprint in db
    const updateSprintObject = {
      sprintStatus: {
        status: SprintStatusEnum.inProgress, updatedAt: generateUtcDate()
      },
      $push: { stages: { $each: newStagesModels } }
    };

    // send mail
    const session = await this.startSession();

    try {
      // update sprint in db
      await this.updateById(model.sprintId, updateSprintObject, session);

      // update project and set published sprint as active sprint in project
      await this._projectService.updateById(model.projectId, { $set: { sprintId: model.sprintId } }, session);
      await this.commitTransaction(session);
      return 'Sprint Published Successfully';
    } catch (e) {
      await this.abortTransaction(session);
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
    const projectDetails = await this._projectService.getProjectDetails(projectId);

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
    sprint = this._sprintUtilityService.prepareSprintVm(sprint);

    // prepare tasks details object only for stage[0], because this is unpublished sprint and in when sprint is not published at that time
    // tasks is only added in only first stage means stage[0]
    sprint.columns[0].tasks.forEach(obj => {
      obj.task = this._sprintUtilityService.parseTaskObjectForUi(obj.task, projectDetails);
    });

    return sprint;
  }

  /**
   * close the sprint
   * @param model
   */
  public async closeSprint(model: CloseSprintModel) {
    const projectDetails = await this._projectService.getProjectDetails(model.projectId);
    const currentSprintDetails = await this.getSprintDetails(model.sprintId);

    const allTaskList = [];

    // loop over stages and add all task to allTaskList
    currentSprintDetails.columns.forEach(stage => {
      stage.tasks.forEach(task => {
        allTaskList.push(task.taskId);
      });
    });

    if (!allTaskList.length) {
      throw new BadRequestException('this sprint don\'t have tasks');
    }

    const session = await this.startSession();

    if (model.createNewSprint) {

    } else {
      // don't create new sprint but move all tasks to backlog with a status
      const isValidFinalStageOfTask = projectDetails.settings.statuses.find(status => status.id === model.finalStatusOfTasks);
      if (!isValidFinalStageOfTask) {
        throw new BadRequestException('task status is not valid, please try again');
      }

      const taskUpdateFilter = {
        _id: { $in: allTaskList }
      };
      const taskUpdateObject = {
        sprintId: null, status: model.finalStatusOfTasks
      };
      await this._taskService.bulkUpdate(taskUpdateFilter, taskUpdateObject, session);
    }
    // const sprintDetails = await this.getSprintDetails(model.sprintId);
    //
    // if (sprintDetails.sprintStatus.status !== SprintStatusEnum.inProgress) {
    //   throw new BadRequestException('Sprint is not published...');
    // }
    //
    // const session = await this.startSession();
    //
    // const allTaskList = [];
    //
    // // loop over stages and add all task to allTaskList
    // sprintDetails.stages.forEach(stage => {
    //   stage.tasks.forEach(task => {
    //     allTaskList.push(task.taskId);
    //   });
    // });
    //
    // try {
    //   await this.update(model.sprintId, {
    //     $set: { 'sprintStatus.status': SprintStatusEnum.closed, 'sprintStatus.updatedAt': generateUtcDate() }
    //   }, session);
    //   await this._taskService.bulkUpdate({ _id: { $in: allTaskList } }, { $set: { sprintId: null } }, session);
    //   await this.commitTransaction(session);
    //   return 'Sprint Closed Successfully';
    // } catch (e) {
    //   await this.abortTransaction(session);
    // }

  }

  /**
   * is duplicate sprint name
   * @param model
   * @param exceptThis
   */
  private async isDuplicate(model: Sprint, exceptThis?: string): Promise<boolean> {
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
}
