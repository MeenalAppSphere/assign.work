import { Task } from './task.model';
import { SprintStatusEnum } from '../enums/sprint.enum';
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
  stages?: SprintStages[];
}

export class SprintStages {
  status: string[];
  tasks: SprintStagesTask[];
}

export class SprintStagesTask {
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

export interface DraftSprint {
  ids: string[];
  tasks: Task[];
  duration: number;
}

export class CreateSprintModel {
  projectId: string;
  sprint: Sprint;
}
