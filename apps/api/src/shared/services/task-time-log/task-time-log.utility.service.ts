import * as moment from 'moment';
import { Project, Task, TaskTimeLog } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { BadRequest } from '../../helpers/helpers';

export class TaskTimeLogUtilityService {
  constructor(protected readonly _taskTimeLogModel: Model<TaskTimeLog & Document>) {
  }

  /**
   * add time log validations
   * @param timeLog
   * @param task
   */
  addTimeLogValidations(timeLog: TaskTimeLog, task: Task) {
    if (!timeLog.createdById) {
      BadRequest('Please add Created By');
    }

    if (!timeLog.loggedTimeReadable) {
      BadRequest('Please add Spent Time');
    }

    if (!timeLog.remainingTimeReadable) {
      BadRequest('Please add Remaining Time');
    }

    if (!timeLog.desc) {
      BadRequest('Please add Description');
    }

    if (!timeLog.startedAt) {
      BadRequest('Please select Start date');
    }

    // if one have worked periodically then check end date is provided or not
    if (timeLog.isPeriod && !timeLog.endAt) {
      BadRequest('Please select End date');
    }

    // Started date validation is before task created date
    const isStartedAtBeforeTaskCreatedAt = moment(timeLog.startedAt).isBefore(task.createdAt);
    if (isStartedAtBeforeTaskCreatedAt) {
      BadRequest('Started Date can not be before Task Creation Date');
    }

    // Started date validation is after today means someone have logged for future
    const isStartedDateInFuture = moment(timeLog.startedAt).isAfter(moment().endOf('d'));
    if (isStartedDateInFuture) {
      BadRequest('You can\'t log time for future date!');
    }

    // check if one have worked periodically and logged time then check start and end date validations
    if (timeLog.isPeriod) {

      // Started date validation is after time log end date
      const isStartDateGraterThenEndDate = moment(timeLog.startedAt).isAfter(timeLog.endAt);
      if (isStartDateGraterThenEndDate) {
        BadRequest('Started Date can not be after End Date');
      }

      // End date validation is before task created date
      const isEndDateBeforeTaskCreatedAt = moment(timeLog.endAt).isBefore(task.createdAt);
      if (isEndDateBeforeTaskCreatedAt) {
        BadRequest('End Date can not be before Task Creation Date');
      }

      // End date validation is before time log start date
      const isEndDateBeforeThenStartDate = moment(timeLog.endAt).isBefore(timeLog.startedAt);
      if (isEndDateBeforeThenStartDate) {
        BadRequest('End Date can not be before Start Date');
      }

    }
  }

  /**
   * working capacity check for adding time
   * @param project
   * @param timeLog
   */
  async workingCapacityCheck(project: Project, timeLog: TaskTimeLog) {
    // get user details from project members
    const userDetails = project.members.find(member => {
      return member.userId === timeLog.createdById;
    });

    // convert startedAt to date object
    const startedDate = moment(timeLog.startedAt);
    // convert endAt to date object, if isPeriod true else use startedAt
    const endDate = moment(timeLog.isPeriod ? timeLog.endAt : timeLog.startedAt);

    // find last logged items in between start and end date
    const lastLogs = await this._taskTimeLogModel.find({
      createdById: timeLog.createdById,
      startedAt: { '$gte': startedDate.startOf('day').toDate() },
      endAt: { '$lt': endDate.endOf('day').toDate() },
      isDeleted: false
    }).lean();

    // if last logs found
    // the one have already logged in between given start and end date
    if (lastLogs && lastLogs.length) {
      const totalLoggedTime = lastLogs.reduce((acc, cur) => {
        return acc + cur.loggedTime;
      }, 0);

      if (!timeLog.isPeriod) {
        // logged only for a certain day
        // check if user logged more than allowed for day
        if ((totalLoggedTime + timeLog.loggedTime) > (userDetails.workingCapacityPerDay * 3600)) {
          BadRequest('your logging limit exceeded for Given date!');
        }
      } else {
        // logged for a period of a time

        // count for how many days one is logging
        // if count is 0 then one is logging is for the same date then mark it as 1
        const countTotalDay = endDate.diff(startedDate, 'd') || 1;

        // logged only for a multiple days ( periodically )
        if ((totalLoggedTime + timeLog.loggedTime) > ((userDetails.workingCapacityPerDay * countTotalDay) * 3600)) {
          BadRequest('your logging limit exceeded for Given dates!');
        }
      }
    }
  }
}
