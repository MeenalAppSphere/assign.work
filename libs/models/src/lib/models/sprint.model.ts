import { Task } from './task.model';
import { SprintErrorEnum, SprintStatusEnum } from '../enums/sprint.enum';
import { User } from './user.model';
import { Project, ProjectStages, ProjectWorkingDays } from './project.model';
import { MongoosePaginateQuery } from '../queryOptions';

export class Sprint {
  id?: string;
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
  autoUpdate?: SprintAutoUpdate;
  sprintStatus: SprintStatus;
  stages?: SprintStage[];
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
}

export class SprintStage {
  id: string;
  stage?: ProjectStages;
  status: string[];
  tasks: SprintStageTask[];
  totalEstimation: number;
  totalEstimationReadable?: string;
}

export class SprintStageTask {
  taskId: string;
  task?: Task;
  description?: string;
  sequenceNumber?: string;
  addedAt: Date;
  updatedAt?: Date;
  addedById: string;
  addedBy?: User;
}

export class SprintAutoUpdate {
  isAllowed: boolean;
  autoUpdateAt: Date;
}

export class SprintStatus {
  status: SprintStatusEnum;
  updatedAt: Date;
}

export class SprintMembersCapacity {
  userId: string;
  user?: User;
  workingCapacity: number;
  workingCapacityReadable?: number;
  workingCapacityPerDay?: number;
  workingCapacityPerDayReadable?: string;
  workingDays?: ProjectWorkingDays[];
}

export class SprintErrorResponse {
  tasksErrors: SprintErrorResponseItem[];
  membersErrors: SprintErrorResponseItem[];
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

export class UpdateSprintModel extends CreateSprintModel {
}

export class SprintBaseRequest {
  projectId: string;
  sprintId: string;
}

export class AddTaskToSprintModel extends SprintBaseRequest {
  tasks: string[];
}

export class RemoveTaskFromSprintModel extends SprintBaseRequest {
  tasks: string[];
}

export class AddTaskRemoveTaskToSprintResponseModel {
  totalCapacity: number;
  totalCapacityReadable: string;
  totalRemainingCapacity: number;
  totalRemainingCapacityReadable: string;
  totalEstimation: number;
  totalEstimationReadable: string;
  tasks: string[];
}

export class MoveTaskToStage extends SprintBaseRequest {
  stageId: string;
  taskId: string;
}

export class TaskAssigneeMap {
  memberId: string;
  totalEstimation: number;
  workingCapacity: number;
  alreadyLoggedTime: number;
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

export class CloseSprintModel extends SprintBaseRequest{
}

export class UpdateSprintMemberWorkingCapacity extends SprintBaseRequest {
  capacity: Array<{
    memberId: string;
    workingCapacityPerDayReadable?: string;
    workingCapacity: number,
    workingCapacityPerDay?: number,
    workingDays?: ProjectWorkingDays[];
  }>;
}
