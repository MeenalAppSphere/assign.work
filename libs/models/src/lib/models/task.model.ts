import { Labels, Project, ProjectStages, TaskType, User } from '@aavantan-app/models';

export class Task {
  id?: string;
  displayName?: string;
  name: string;
  description?: string;
  dueReminder?: string;
  dueDate?: Date;
  dueComplete?: boolean;
  stage?: string | ProjectStages;
  project?: string | Project;
  position?: number;
  priority?: string;
  tags?: string[];
  comments?: any[];
  assignee?: string | User;
  assigned?: User[];
  url?: string;
  attachments?: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
  progress?: number;
  loggedTime?: TaskLoggedTime[];
  totalLoggedTime?: number;
  estimateTime?: string;
  status?: string;
  sprint?: string;
  taskType?: string | TaskType;
}

export class TaskLoggedTime {
  id?: string;
  createdAt: Date;
  loggedTime: string;
  startDate: string;
  endDate: string;
  description: string;
}

export class TaskAttachment {
  id: string;
  memberId: string;
  isUpload: boolean;
  mimeType: string;
  name: string;
  url: string;
  createdAt: Date;
}

export class TaskComments {

}
