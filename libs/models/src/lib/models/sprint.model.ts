import { Task } from './task.model';
import { SprintErrorEnum, SprintStatusEnum } from '../enums/sprint.enum';
import { User } from './user.model';
import { Project } from './project.model';

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
  ids: string[];
  tasks: Task[];
  duration: number;
}

export class CreateSprintModel {
  sprint: Sprint;
}

export class AddTaskToSprintModel {
  projectId: string;
  sprintId: string;
  tasks: string[];
}

export class MoveTaskToStage {
  projectId: string;
  sprintId: string;
  stageId: string;
  taskId: string;
}

export class TaskAssigneeMap {
  memberId: string;
  totalEstimation: number;
  workingCapacityPerDay: number;
  alreadyLoggedTime: number;
}
