import { Document, Model } from 'mongoose';
import { Project, Sprint, SprintErrorEnum, SprintErrorResponseItem, Task } from '@aavantan-app/models';
import { BadRequestException } from '@nestjs/common';
import * as moment from 'moment';
import { secondsToHours, secondsToString } from '../../helpers/helpers';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';

export class SprintUtilityService {
  constructor(protected readonly _sprintModel: Model<Sprint & Document>) {
  }

  /**
   * common sprint related validations
   * check name, started At, end At, goal present or not
   * check sprint start date is not before today
   * check sprint end date is not before start date
   * @param sprint
   */
  commonSprintValidator(sprint: Sprint) {
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

  /**
   * check whether sprint name is available or not
   * @param projectId
   * @param name
   */
  async sprintNameAvailable(projectId: string, name: string): Promise<boolean> {
    const sprintNameAvailability = await this._sprintModel.find({
      projectId: projectId, name: { $regex: new RegExp(`^${name.trim()}$`), $options: 'i' }, isDeleted: false
    }).select('name').countDocuments();

    return sprintNameAvailability === 0;
  }

  /**
   * check whether task is valid or not to add in sprint or move in a stage
   * @param task
   * @param isMoveTaskProcess
   */
  checkTaskIsAllowedToAddInSprint(task: Task, isMoveTaskProcess: boolean = false): boolean | SprintErrorResponseItem {
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
      if (!isMoveTaskProcess && task.sprintId) {
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
   * convert sprint object to it's view model
   * @param sprint
   * @returns {Sprint}
   * @param projectDetails
   */
  prepareSprintVm(sprint: Sprint, projectDetails: Project): Sprint {
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
  parseTaskObjectForUi(task: Task, projectDetails: Project) {
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
}
