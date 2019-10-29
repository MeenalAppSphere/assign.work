import { Labels, TaskType, User } from '@aavantan-app/models';

export class Task {
  id?: string;
  taskId:string;
  name: string;
  shortLink?: string;
  closed?: boolean;
  dateLastActivity?: Date;
  description?: string;
  dueReminder?: string;
  due?: Date;
  dueComplete?: boolean;
  stageId?: string;
  projectId?: string;
  position?: number;
  priority?: string;
  labelsId?: any[];
  comments?: any[];
  assigned?: User[];
  shortUrl?: string;
  url?: string;
  labels?: Labels[];
  attachments?: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
  progress?: number;
  status?: string;
  estimate?: string;
  selectedForSprint?: boolean;
  taskType?: string | TaskType;
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
