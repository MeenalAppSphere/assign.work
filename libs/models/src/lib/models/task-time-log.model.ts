import { Task, User } from '@aavantan-app/models';

export class TaskTimeLog {
  taskId: string;
  sprintId?: string;
  task?: Task;
  startedAt: Date;
  endAt?: Date;
  createdById: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;
  createdAt?: Date;
  updatedAt?: Date;
  desc: string;
  loggedTime?: number;
  loggedTimeReadable: string;
  remainingTime?: number;
  remainingTimeReadable: string;
  isDeleted?: boolean;
  isPeriod?: boolean;
}

export class AddTaskTimeModel {
  projectId: string;
  timeLog: TaskTimeLog;
}

export class TaskTimeLogResponse {
  taskId?: string;
  sprintId?: string;
  progress: number;
  totalLoggedTime: number;
  totalLoggedTimeReadable: string;
  remainingTime?: number;
  remainingTimeReadable: string;
  overLoggedTime: number;
  overLoggedTimeReadable: string;
  overProgress: number;
}

export class TaskTimeLogHistoryModel {
  user: string;
  emailId: string;
  profilePic: string;
  totalLoggedTime: number;
  totalLoggedTimeReadable: string;
}
