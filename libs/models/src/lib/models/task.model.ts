import { Labels, TaskType, User } from '@aavantan-app/models';

export class Task {
  id?: string;
  taskId?:string;
  name: string;
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
  tagsId?: any[];
  comments?: any[];
  assigned?: User[];
  url?: string;
  attachments?: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
  progress?: number;
  loggedTime?:TaskLoggedTime[];
  totalLoggedTime?:number;
  estimate?: string;
  status?: string;
  selectedForSprint?: boolean;
  taskType?: string | TaskType;
}

export class TaskLoggedTime {
  id?:string;
  createdAt:Date;
  loggedTime:string;
  startDate:string;
  endDate:string;
  description:string;
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
