import {
  Project,
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

  /**
   * create sprint report model from sprint
   * @param sprint
   * @param project
   */
  createSprintReportModelFromSprint(sprint: Sprint, project: Project) {
    const report: SprintReportModel = new SprintReportModel();

    report.projectId = sprint.projectId;
    report.sprintId = sprint.id;
    report.reportTasks = this.createSprintReportTasksFromSprintColumns(sprint.columns);
    report.reportMembers = this.createSprintReportMembersFromSprintMembers(sprint.membersCapacity);

    const lastColumnOfSprint = project.activeBoard.columns[project.activeBoard.columns.length - 1];
    report.finalStatusIds = lastColumnOfSprint.includedStatuses.map(status => status.statusId);

    return report;
  }

  /**
   * create sprint report tasks from sprint columns
   * @param columns
   */
  createSprintReportTasksFromSprintColumns(columns: SprintColumn[]): SprintReportTasksModel[] {
    const reportTasks = [];

    // loop over columns
    columns.forEach(column => {
      // loop over tasks and create report task
      column.tasks.forEach(task => {
        // get report task object from sprint column task
        const reportTask = this.createSprintReportTaskFromSprintColumnTask(task.task);
        reportTasks.push(reportTask);
      });
    });

    return reportTasks;
  }

  /**
   * create report task model from sprint column task
   * @param task
   */
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

  /**
   * create sprint report member from sprint members
   * @param membersCapacity
   */
  createSprintReportMembersFromSprintMembers(membersCapacity: SprintMembersCapacity[]) {
    const members = [];

    // loop over member capacity from sprint
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

  /**
   * prepare tasks count report
   * if sprint is running report will be generated for all tasks
   * if sprint is closed report will be generated for all unfinished tasks
   * @param report
   * @param taskStatuses
   */
  prepareSprintReportTasksCountReport(report: SprintReportModel, taskStatuses: TaskStatusModel[]) {
    if (report.sprint.sprintStatus && report.sprint.sprintStatus.status === SprintStatusEnum.inProgress) {

      const allTasks: SprintReportTaskReportModel[] = [];

      // loop over project task statuses
      taskStatuses.forEach(status => {
        const groupedTasks = [];

        // loop over report tasks and group by status
        report.reportTasks.forEach(reportTask => {
          if (reportTask.statusId.toString() === status._id.toString()) {
            reportTask.status = status;
            groupedTasks.push(reportTask);
          }
          return reportTask;
        });

        // new report task model
        const task = new SprintReportTaskReportModel();

        task.statusId = status._id;
        task.status = status;
        task.count = groupedTasks.length;

        // calculate total estimated time
        task.totalEstimatedTime = sumBy(groupedTasks, 'estimatedTime') || 0;
        task.totalEstimatedTimeReadable = secondsToString(task.totalEstimatedTime);

        // calculate total logged time
        task.totalLoggedTime = sumBy(groupedTasks, 'totalLoggedTime') || 0;
        task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime);

        // calculate total remaining time
        task.totalRemainingTime = task.totalEstimatedTime - task.totalLoggedTime || 0;
        task.totalRemainingTimeReadable = secondsToString(task.totalRemainingTime);

        allTasks.push(task);
      });

      // assign all tasks
      report.allTasks = allTasks;

      // set default zero value for all totals
      report.allTasksCount = 0;
      report.allTaskTotalEstimatedTime = 0;
      report.allTaskTotalLoggedTime = 0;
      report.allTaskTotalRemainingTime = 0;

      // loop over all tasks and calculate all totals
      allTasks.forEach(task => {
        report.allTasksCount += task.count;
        report.allTaskTotalEstimatedTime += task.totalEstimatedTime;
        report.allTaskTotalLoggedTime += task.totalLoggedTime;
        report.allTaskTotalRemainingTime += task.totalRemainingTime;
      });

      // convert totals to readable format
      report.allTaskTotalEstimatedTimeReadable = secondsToString(report.allTaskTotalEstimatedTime);
      report.allTaskTotalLoggedTimeReadable = secondsToString(report.allTaskTotalLoggedTime);
      report.allTaskTotalRemainingTimeReadable = secondsToString(report.allTaskTotalRemainingTime);
    }

    report.reportTasksCount = report.reportTasks.length;
    report.finishedTasksCount = report.reportTasks.filter(task => {
      return report.finalStatusIds.some(reportTask => reportTask.toString() === task.statusId.toString());
    }).length;
  }

  /**
   * prepare report for user productivity in a sprint
   * @param report
   */
  prepareSprintReportUserProductivity(report: SprintReportModel) {
    // loop over report members
    report.reportMembers = report.reportMembers.map(member => {
      // convert totalLoggedTimeReadable, workingCapacityReadable to readable string
      member.totalLoggedTimeReadable = secondsToString(member.totalLoggedTime);
      member.workingCapacityReadable = secondsToString(member.workingCapacity);

      // calculate total remaining capacity in sprint
      member.totalRemainingWorkingCapacity = member.workingCapacity - member.totalLoggedTime;
      member.totalRemainingWorkingCapacityReadable = secondsToString(member.totalRemainingWorkingCapacity);

      // calculate total assign time of a particular user
      member.totalAssignedTime = report.reportTasks.reduce((pv, cv) => {
        if (cv.assigneeId.toString() === member.userId.toString()) {
          return pv + cv.estimatedTime;
        } else {
          return pv;
        }
      }, 0);
      member.totalAssignedTimeReadable = secondsToString(member.totalAssignedTime);

      // calculate total remaining time
      member.totalRemainingTime = member.totalAssignedTime - member.totalLoggedTime;
      member.totalRemainingTimeReadable = secondsToString(member.totalRemainingTime);

      // calculate sprint productivity
      member.sprintProductivity = Number(((member.totalLoggedTime * 100) / member.totalAssignedTime).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;
      return member;
    });

    // set 0 as default for to all totals that we are going to calculate
    report.reportMembersTotalAssignedTime = 0;
    report.reportMembersTotalWorkingCapacity = 0;
    report.reportMembersTotalRemainingWorkingCapacity = 0;
    report.reportMembersTotalLoggedTime = 0;
    report.reportMembersTotalRemainingTime = 0;
    report.reportMembersTotalSprintProductivity = 0;

    // loop over members and calculate each totals
    report.reportMembers.forEach(member => {
      report.reportMembersTotalAssignedTime += member.totalAssignedTime;
      report.reportMembersTotalWorkingCapacity += member.workingCapacity;
      report.reportMembersTotalRemainingWorkingCapacity += member.totalRemainingWorkingCapacity;
      report.reportMembersTotalLoggedTime += member.totalLoggedTime;
      report.reportMembersTotalRemainingTime += member.totalRemainingTime;
      report.reportMembersTotalSprintProductivity += member.sprintProductivity;
    });

    // convert all totals to readable format
    report.reportMembersTotalAssignedTimeReadable = secondsToString(report.reportMembersTotalAssignedTime);
    report.reportMembersTotalWorkingCapacityReadable = secondsToString(report.reportMembersTotalWorkingCapacity);
    report.reportMembersTotalRemainingWorkingCapacityReadable = secondsToString(report.reportMembersTotalRemainingWorkingCapacity);
    report.reportMembersTotalLoggedTimeReadable = secondsToString(report.reportMembersTotalLoggedTime);
    report.reportMembersTotalRemainingTimeReadable = secondsToString(report.reportMembersTotalRemainingTime);
  }
}
