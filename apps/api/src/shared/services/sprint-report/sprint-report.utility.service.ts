import {
  Sprint,
  SprintColumn,
  SprintMembersCapacity,
  SprintStatusEnum,
  Task,
  TaskStatusModel
} from '@aavantan-app/models';
import { sumBy } from 'lodash';
import {
  SprintReportMembersModel,
  SprintReportModel,
  SprintReportTaskReportModel,
  SprintReportTasksModel
} from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { secondsToString, toObjectId } from '../../helpers/helpers';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';

export class SprintReportUtilityService {
  constructor() {
  }

  createSprintReportModelFromSprint(sprint: Sprint) {
    const report: SprintReportModel = new SprintReportModel();

    report.projectId = sprint.projectId;
    report.sprintId = sprint.id;
    report.reportTasks = this.createSprintReportTasksFromSprintColumns(sprint.columns);
    report.reportMembers = this.createSprintReportMembersFromSprintMembers(sprint.membersCapacity);

    return report;
  }

  createSprintReportTasksFromSprintColumns(columns: SprintColumn[]): SprintReportTasksModel[] {
    const reportTasks = [];

    columns.forEach(column => {
      column.tasks.forEach(task => {
        const reportTask = this.createSprintReportTaskFromSprintColumnTask(task.task);
        reportTasks.push(reportTask);
      });
    });

    return reportTasks;
  }

  createSprintReportTaskFromSprintColumnTask(task: Task): SprintReportTasksModel {
    const reportTask = new SprintReportTasksModel();

    reportTask.taskId = task._id;
    reportTask.name = task.name;
    reportTask.displayName = task.displayName;
    reportTask.description = task.description;
    reportTask.assigneeId = task.assigneeId;
    reportTask.statusId = task.statusId;
    reportTask.priorityId = task.priorityId;
    reportTask.taskTypeId = task.taskTypeId;
    reportTask.estimatedTime = task.estimatedTime;
    reportTask.totalLoggedTime = 0;
    reportTask.createdById = task.createdById;
    reportTask.createdAt = task.createdAt;

    return reportTask;
  }

  createSprintReportMembersFromSprintMembers(membersCapacity: SprintMembersCapacity[]) {
    const members = [];

    membersCapacity.forEach(capacity => {
      const member = new SprintReportMembersModel();
      member.userId = toObjectId(capacity.userId as string);
      member.workingCapacity = capacity.workingCapacity;
      member.workingCapacityPerDay = capacity.workingCapacityPerDay;
      member.totalLoggedTime = 0;
      member.taskWiseTimeLog = [];
      members.push(member);
    });

    return members;
  }

  prepareSprintReportTasksCountReport(report: SprintReportModel, taskStatuses: TaskStatusModel[]) {
    if (report.sprint.sprintStatus && report.sprint.sprintStatus.status === SprintStatusEnum.inProgress) {

      const allTasks: SprintReportTaskReportModel[] = [];
      taskStatuses.forEach(status => {
        const groupedTasks = [];

        report.reportTasks.forEach(reportTask => {
          if (reportTask.statusId.toString() === status._id.toString()) {
            reportTask.status = status;
            groupedTasks.push(reportTask);
          }
          return reportTask;
        });

        const task = new SprintReportTaskReportModel();

        task.statusId = status._id;
        task.status = status;
        task.count = groupedTasks.length;

        task.totalEstimatedTime = sumBy(groupedTasks, 'estimatedTime') || 0;
        task.totalEstimatedTimeReadable = secondsToString(task.totalEstimatedTime);

        task.totalLoggedTime = sumBy(groupedTasks, 'totalLoggedTime') || 0;
        task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime);

        task.totalRemainingTime = task.totalEstimatedTime - task.totalLoggedTime || 0;
        task.totalRemainingTimeReadable = secondsToString(task.totalRemainingTime);

        allTasks.push(task);
      });

      report.allTasks = allTasks;
      report.allTasksCount = sumBy(allTasks, 'count');

      report.allTaskTotalEstimatedTime = sumBy(allTasks, 'totalEstimatedTime');
      report.allTaskTotalEstimatedTimeReadable = secondsToString(report.allTaskTotalEstimatedTime);

      report.allTaskTotalLoggedTime = sumBy(allTasks, 'totalLoggedTime');
      report.allTaskTotalLoggedTimeReadable = secondsToString(report.allTaskTotalLoggedTime);

      report.allTaskTotalRemainingTime = sumBy(allTasks, 'totalRemainingTime');
      report.allTaskTotalRemainingTimeReadable = secondsToString(report.allTaskTotalRemainingTime);
    }

    report.reportTasksCount = report.reportTasks.length;
    report.finishedTasksCount = report.reportTasks.filter(task => {
      return report.finalStatusIds.some(status => status.toString() === task.statusId.toString());
    }).length;
  }

  prepareSprintReportUserProductivity(report: SprintReportModel) {

    report.reportMembers = report.reportMembers.map(member => {
      member.totalLoggedTimeReadable = secondsToString(member.totalLoggedTime);
      member.workingCapacityReadable = secondsToString(member.workingCapacity);

      member.totalRemainingTime = member.workingCapacity - member.totalLoggedTime;
      member.totalRemainingTimeReadable = secondsToString(member.totalRemainingTime);

      member.totalAssignedTime = report.reportTasks.reduce((pv, cv) => {
        if (cv.assigneeId.toString() === member.userId.toString()) {
          return pv + cv.estimatedTime;
        } else {
          return pv;
        }
      }, 0);
      member.totalAssignedTimeReadable = secondsToString(member.totalAssignedTime);

      member.sprintProductivity = Number(((member.totalLoggedTime * 100) / member.totalAssignedTime).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;
      return member;
    });

    report.reportMembersTotalAssignedTime = 0;
    report.reportMembersTotalWorkingCapacity = 0;
    report.reportMembersTotalLoggedTime = 0;
    report.reportMembersTotalRemainingTime = 0;
    report.reportMembersTotalSprintProductivity = 0;

    report.reportMembers.forEach(member => {
      report.reportMembersTotalAssignedTime += member.totalAssignedTime;
      report.reportMembersTotalWorkingCapacity += member.workingCapacity;
      report.reportMembersTotalLoggedTime += member.totalLoggedTime;
      report.reportMembersTotalRemainingTime += member.totalRemainingTime;
      report.reportMembersTotalSprintProductivity += member.sprintProductivity;
    });

    report.reportMembersTotalAssignedTimeReadable = secondsToString(report.reportMembersTotalAssignedTime);

    report.reportMembersTotalWorkingCapacityReadable = secondsToString(report.reportMembersTotalWorkingCapacity);

    report.reportMembersTotalLoggedTimeReadable = secondsToString(report.reportMembersTotalLoggedTime);

    report.reportMembersTotalRemainingTimeReadable = secondsToString(report.reportMembersTotalRemainingTime);
  }
}
