import { Sprint, SprintColumn, SprintColumnTask, SprintMembersCapacity, Task } from '@aavantan-app/models';
import { groupBy } from 'lodash';
import {
  SprintReportMembersModel,
  SprintReportModel, SprintReportTaskReportModel,
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

  prepareSprintReportTasksCountReport(reportTasks: SprintReportTasksModel[]) {
    const allTasks: SprintReportTaskReportModel[] = [];
    const groupedTasks = groupBy<SprintReportTasksModel>(reportTasks, (task) => task.statusId);

    Object.keys(groupedTasks).forEach(key => {
      const task = new SprintReportTaskReportModel();

      task.statusId = key;
      task.count = groupedTasks[key].length;
      task.totalEstimatedTime = groupedTasks[key].reduce((pv, cv) => {
        return pv + cv.estimatedTime;
      }, 0);
      task.totalEstimatedTimeReadable = secondsToString(task.totalEstimatedTime);

      task.totalLoggedTime = groupedTasks[key].reduce((pv, cv) => {
        return pv + cv.totalLoggedTime;
      }, 0);
      task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime);

      allTasks.push(task);
    });

    return allTasks;
  }

  prepareSprintReportUserProductivity(reportMembers: SprintReportMembersModel[], sprint: Sprint): SprintReportMembersModel[] {
    return reportMembers.map(member => {
      member.sprintProductivity = Number(((member.totalLoggedTime * 100) / sprint.totalLoggedTime).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;
      return member;
    });
  }
}
