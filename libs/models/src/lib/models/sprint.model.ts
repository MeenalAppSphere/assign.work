import { Task } from './task.model';
import { SprintErrorEnum, SprintStatusEnum } from '../enums/sprint.enum';
import { User } from './user.model';
import { Project, ProjectWorkingDays } from './project.model';
import { MongoosePaginateQuery } from '../queryOptions';
import { Types } from 'mongoose';
import { TaskStatusModel } from './task-status.model';

export class Sprint {
  id?: string;
  _id?: string;
  name: string;
  projectId: string;
  project?: Project;
  createdById: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;
  goal: string;
  startedAt: Date;
  endAt: Date;
  sprintDaysLeft?: number;
  autoUpdate?: SprintAutoUpdate;
  sprintStatus: SprintStatus;
  columns?: SprintColumn[];
  membersCapacity?: SprintMembersCapacity[];
  totalCapacity?: number;
  totalCapacityReadable?: string;
  totalRemainingCapacity?: number;
  totalRemainingCapacityReadable?: string;
  totalEstimation?: number;
  totalEstimationReadable?: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  totalOverLoggedTime?: number;
  totalOverLoggedTimeReadable?: string;
  totalRemainingTime?: number;
  totalRemainingTimeReadable?: string;
  progress?: number;
  overProgress?: number;
  reportId?: string;
  totalItems?: number;
}

export class SprintColumn {
  id: string;
  statusId: string;
  status?: TaskStatusModel;
  name?: string;
  tasks: SprintColumnTask[];
  totalEstimation: number;
  totalEstimationReadable?: string;
  isHidden: boolean;
}

export class SprintColumnTask {
  taskId: string;
  totalLoggedTime: number;
  totalLoggedTimeReadable?: string;
  task?: Task;
  description?: string;
  sequenceNumber?: string;
  addedAt?: Date;
  updatedAt?: Date;
  addedById?: string;
  addedBy?: User;
  movedAt?: Date;
  movedById?: string;
  movedBy?: User;
  removedAt?: Date;
  removedById?: string;
  removedBy?: User;
}

export class SprintAutoUpdate {
  isAllowed: boolean;
  autoUpdateAt: Date;
}

export class SprintStatus {
  status: SprintStatusEnum;
  updatedAt: Date;
  updatedById?: string;
  updatedBy?: User;
}

export class SprintMembersCapacity {
  userId: string | Types.ObjectId;
  user?: User;
  workingCapacity: number;
  workingCapacityReadable?: string;
  workingCapacityPerDay?: number;
  workingCapacityPerDayReadable?: string;
  workingDays?: ProjectWorkingDays[];
  isRemoved?: boolean;
}

export class SprintErrorResponse {
  tasksError: SprintErrorResponseItem;
  membersError: SprintErrorResponseItem;
}

export class SprintErrorResponseItem {
  id: string;
  name?: string;
  reason: SprintErrorEnum;
}

export interface DraftSprint {
  sprintId?: string;
  ids?: string[];
  tasks?: Task[];
  duration?: number;
  totalCapacity?: number;
  totalCapacityReadable?: string;
  totalRemainingCapacity?: number;
  totalRemainingCapacityReadable?: string;
  totalEstimation?: number;
  totalEstimationReadable?: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  totalOverLoggedTime?: number;
  totalOverLoggedTimeReadable?: string;
  totalRemainingTime?: number;
  totalRemainingTimeReadable?: string;
}

export class CreateSprintModel {
  sprint: Sprint;
}

export class CreateSprintCloseSprintCommonModel {
  sprint: Sprint;
  doPublishSprint?: boolean;
  updateSprintMemberCapacity?: boolean;
  unFinishedTasks?: Task[];
}

export class UpdateSprintModel extends CreateSprintModel {
}

export class SprintBaseRequest {
  projectId: string;
  sprintId: string;
}

export class AddTaskToSprintModel extends SprintBaseRequest {
  taskId: string;
  adjustHoursAllowed?: boolean;
}

export class RemoveTaskFromSprintModel extends SprintBaseRequest {
  taskId: string;
}

export class AssignTasksToSprintModel extends SprintBaseRequest {
  tasks: string[];
}

export class SprintDurationsModel {
  totalCapacity: number;
  totalCapacityReadable: string;
  totalRemainingCapacity: number;
  totalRemainingCapacityReadable: string;
  totalEstimation: number;
  totalEstimationReadable: string;
}

export class MoveTaskToColumnModel extends SprintBaseRequest {
  columnId: string;
  taskId: string;
  dropIndex: number;
}

export class GetAllSprintRequestModel extends MongoosePaginateQuery {
  projectId: string;
}

export class GetUnpublishedRequestModel {
  projectId: string;
}

export class GetSprintByIdRequestModel extends SprintBaseRequest {
}

export class PublishSprintModel extends SprintBaseRequest {
}

export class CloseSprintModel extends SprintBaseRequest {
  createNewSprint: boolean;
  createAndPublishNewSprint: boolean;
  updateMemberCapacity: boolean;
  sprint?: Sprint;
}

export class UpdateSprintMemberWorkingCapacity extends SprintBaseRequest {
  capacity: Array<{
    memberId: string;
    workingCapacityPerDayReadable?: string;
    workingCapacity: number;
    workingCapacityPerDay?: number;
    workingDays?: ProjectWorkingDays[];
  }>;
}

export class SprintFilterTasksModel extends SprintBaseRequest {
  assigneeIds: string[];
  query?: string;

  constructor(projectId: string, sprintId: string) {
    super();
    this.projectId = projectId;
    this.sprintId = sprintId;

    this.assigneeIds = [];
    this.query = '';
  }
}

export class SprintPanel {
  active:boolean;
  name:string;
  disabled?:boolean;
}
