import { Sprint, SprintColumn, SprintColumnTask, Task } from '@aavantan-app/models';
import { groupBy } from 'lodash';
import {
  SprintReportModel, SprintReportTaskReportModel,
  SprintReportTasksModel
} from '../../../../../../libs/models/src/lib/models/sprint-report.model';

export class SprintReportUtilityService {
  constructor() {
  }

  createSprintReportModelFromSprint(sprint: Sprint) {
    const report: SprintReportModel = new SprintReportModel();

    report.projectId = sprint.projectId;
    report.sprintId = sprint.id;
    report.reportTasks = this.prepareSprintReportTasksFromSprintColumns(sprint.columns);
    report.reportMembers = [];

    return report;
  }

  prepareSprintReportTasksFromSprintColumns(columns: SprintColumn[]): SprintReportTasksModel[] {
    const reportTasks = [];

    columns.forEach(column => {
      column.tasks.forEach(task => {
        const reportTask = this.prepareSprintReportTaskFromSprintColumnTask(task.task);
        reportTasks.push(reportTask);
      });
    });

    return reportTasks;
  }

  prepareSprintReportTaskFromSprintColumnTask(task: Task): SprintReportTasksModel {
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
      task.totalLoggedTime = groupedTasks[key].reduce((pv, cv) => {
        return pv + cv.totalLoggedTime;
      }, 0);

      allTasks.push(task);
    });

    return allTasks;
  }
}
