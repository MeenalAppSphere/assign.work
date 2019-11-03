import { AttachmentModel, Project, ProjectPriority, TaskType, User } from '@aavantan-app/models';

export class Task {
  id?: string;
  name: string;
  displayName?: string;
  description?: string;
  project: string | Project;
  assignee?: string | User;
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
  createdBy: string | User;
  updatedBy?: string | User;
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
