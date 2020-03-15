import { BaseDbModel } from './base.model';
import { Sprint, SprintMembersCapacity, TaskPriorityModel, TaskStatusModel, User } from '@aavantan-app/models';

export class SprintReportModel extends BaseDbModel {
  projectId: string;
  sprintId: string;
  sprint?: Sprint;
  reportTasks: SprintReportTasksModel[];
  reportMembers: SprintReportMembersModel[];
  allTasks?: SprintReportTaskReportModel[];
  unfinishedTasks?: SprintReportTaskReportModel[];
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
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  taskWiseTimeLog: SprintReportMembersTaskLoggingModel[];
}

export class SprintReportMembersTaskLoggingModel {
  taskId?: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
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
}
