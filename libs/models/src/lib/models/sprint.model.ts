import { Task } from './task.model';
import { SprintErrorEnum, SprintStatusEnum } from '../enums/sprint.enum';
import { User } from './user.model';
import { Project } from './project.model';
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
}

export class SprintStage {
  id: string;
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
  workingCapacityPerDay?: number;
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
  sprintId: string;
  ids: string[];
  tasks: Task[];
  duration: number;
  durationReadable: string;
}

export class CreateSprintModel {
  sprint: Sprint;
}

export class SprintBaseRequest {
  projectId: string;
  sprintId: string;
}

export class AddTaskToSprintModel extends SprintBaseRequest {
  tasks: string[];
}

export class MoveTaskToStage extends SprintBaseRequest {
  stageId: string;
  taskId: string;
}

export class TaskAssigneeMap {
  memberId: string;
  totalEstimation: number;
  workingCapacityPerDay: number;
  alreadyLoggedTime: number;
}

export class GetAllSprintRequestModel extends MongoosePaginateQuery {
  projectId: string;
}

export class GetSprintByIdRequestModel extends SprintBaseRequest {
}

export class PublishSprintModel extends SprintBaseRequest{
}

export class UpdateSprintMemberWorkingCapacity extends SprintBaseRequest {
  memberId: string;
  workingCapacityPerDayReadable: string;
}
