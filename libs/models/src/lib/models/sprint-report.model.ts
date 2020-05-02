import { BaseDbModel } from './base.model';
import { Sprint, SprintMembersCapacity, TaskPriorityModel, TaskStatusModel, User } from '@aavantan-app/models';

export class SprintReportModel extends BaseDbModel {
  projectId: string;
  sprintId: string;
  sprint?: Sprint;
  status?: string;
  sprintDuration: string;

  reportMembers: SprintReportMembersModel[];

  reportMembersTotalAssignedTime: number;
  reportMembersTotalAssignedTimeReadable: string;
  reportMembersTotalWorkingCapacity: number;
  reportMembersTotalWorkingCapacityReadable: string;
  reportMembersTotalRemainingWorkingCapacity: number;
  reportMembersTotalRemainingWorkingCapacityReadable: string;
  reportMembersTotalLoggedTime: number;
  reportMembersTotalLoggedTimeReadable: string;
  reportMembersTotalRemainingTime: number;
  reportMembersTotalRemainingTimeReadable: string;
  reportMembersTotalSprintProductivity: number;

  reportTasks: SprintReportTasksModel[];
  reportTasksCount: number;
  finishedTasksCount: number;
  finalStatusIds: string[];
  finalStatuses?: TaskStatusModel[];

  allTasks?: SprintReportTaskReportModel[];
  allTasksCount: number;
  allTaskTotalEstimatedTime?: number;
  allTaskTotalEstimatedTimeReadable?: string;
  allTaskTotalLoggedTime?: number;
  allTaskTotalLoggedTimeReadable?: string;
  allTaskTotalRemainingTime?: number;
  allTaskTotalRemainingTimeReadable?: string;
}

export class SprintReportTasksModel {
  taskId: string;
  name: string;
  displayName: string;
  description: string;
  assigneeId?: string;
  assignee?: User;
  taskType?: any;
  taskTypeId?: any;
  priority?: TaskPriorityModel;
  priorityId?: string;
  status?: TaskStatusModel;
  statusId?: string;
  estimatedTime?: number;
  estimatedTimeReadable?: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  isDeleted?: boolean;
  createdById: string;
  createdBy?: User;
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date;
  removedById?: string;
}

export class SprintReportMembersModel extends SprintMembersCapacity {
  totalRemainingWorkingCapacity?: number;
  totalRemainingWorkingCapacityReadable?: string;
  totalAssignedTime: number;
  totalAssignedTimeReadable: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  totalRemainingTime?: number;
  totalRemainingTimeReadable?: string;
  taskWiseTimeLog: SprintReportMembersTaskLoggingModel[];
  sprintProductivity?: number;
}

export class SprintReportMembersTaskLoggingModel {
  taskId?: string;
  loggedTime?: number;
  loggedTimeReadable?: string;
  loggedAt: Date;
}

export class SprintReportTaskReportModel {
  statusId: string;
  status?: TaskStatusModel;
  count: number;
  totalEstimatedTime?: number;
  totalEstimatedTimeReadable?: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  totalRemainingTime?: number;
  totalRemainingTimeReadable?: string;
}
