import { Task, User } from '@aavantan-app/models';

export class TaskTimeLog {
  taskId: string;
  task?: Task;
  startedAt: Date;
  endAt: Date;
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
}

export class AddTaskTimeModel {
  projectId: string;
  timeLog: TaskTimeLog;
}

export class TaskTimeLogResponse {
  taskId: string;
  progress: number;
  totalLoggedTime: number;
  totalLoggedTimeReadable: string;
  overLoggedTime: number;
  overLoggedTimeReadable: string;
  overProgress: number;
}
