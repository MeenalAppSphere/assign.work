import { AttachmentModel, Project, ProjectPriority, TaskType, User } from '@aavantan-app/models';
import { TaskHistoryActionEnum } from '../enums/task.enum';

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
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  attachments?: string[];
  attachmentsDetails?: AttachmentModel[];
  isPinned: boolean;
}

export class TaskHistory {
  taskId: string;
  task?: Task;
  action: TaskHistoryActionEnum;
  createdById: string;
  createdBy?: User;
  createdAt?: Date;
  desc?: string;
}

export class TaskFilterDto {
  id?: string;
  _id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  project?: string | string[];
  assignee?: string | string[];
  taskType?: string | string[];
  priority?: string | string[];
  tags?: string | string[];
  status?: string | string[];
  sprint?: string | string[];
  createdBy?: string | string[];
  sort?: string;
  sortBy?: string;
  startedAt?: Date;
  finishedAt?: Date;
}
