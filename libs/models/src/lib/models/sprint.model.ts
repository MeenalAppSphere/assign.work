import { Task } from './task.model';
import { SprintErrorEnum, SprintStatusEnum } from '../enums/sprint.enum';
import { User } from './user.model';

export class Sprint {
  id?: string;
  name: string;
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
}

export class SprintStageTask {
  taskId: string;
  description: string;
  sequenceNumber: string;
  addedAt: Date;
  updatedAt: Date;
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
  name: string;
  reason: SprintErrorEnum;
}

export interface DraftSprint {
  ids: string[];
  tasks: Task[];
  duration: number;
}

export class CreateSprintModel {
  projectId: string;
  sprint: Sprint;
}

export class AddTaskToSprintModel {
  projectId: string;
  sprintId: string;
  tasks: Task[];
}
