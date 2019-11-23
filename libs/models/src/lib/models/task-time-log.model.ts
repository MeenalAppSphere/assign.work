import { Task, User } from '@aavantan-app/models';

export class TaskTimeLog {
  taskId: string;
  task?: Task;
  createdById: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;
  createdAt?: Date;
  updatedAt?: Date;
  desc: string;
  spentTime: number;
  spentTimeReadable?: string;
  remainingTime: number;
  remainingTimeReadable?: string;
  isDeleted?: boolean;
}
