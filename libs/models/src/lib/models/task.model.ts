import { AttachmentModel, Project, ProjectPriority, TaskType, User } from '@aavantan-app/models';

export class Task {
  id?: string;
  name: string;
  displayName?: string;
  description?: string;
  projectId: string;
  project?: Project;
  assigneeId?: string;
  assignee?: User;
  attachments?: AttachmentModel[];
  taskType: string | TaskType;
  comments?: TaskComments[];
  estimateTime?: number;
  remainingTime?: number;
  totalLoggedTime?: number;
  startedAt?: Date;
  finishedAt?: Date;
  priority?: string | ProjectPriority;
  tags?: string[];
  url?: string;
  progress?: number;
  status?: string;
  sprint?: string;
  createdById: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TaskComments {
  id?: string;
  comment: string;
  createdBy: string | User;
  createdAt: Date;
  attachments: string[] | AttachmentModel[];
  isPinned: boolean;
}

export class TaskHistory {
  task: string | Task;
  action: string;
  createdBy: string | User;
  createdAt?: Date;
  desc?: string;
}

export class TaskFilterDto {
  name?: string | string[];
  displayName?: string | string[];
  description?: string | string[];
  project?: string | string[];
  assignee?: string | string[];
  taskType?: string | string[];
  priority?: string | string[];
  tags?: string | string[];
  status?: string | string[];
  sprint?: string | string[];
  createdBy?: string | string[];
  q?: string;
  sort?: string;
  sortBy?: string;
  startedAt?: Date;
  finishedAt?: Date;
}
