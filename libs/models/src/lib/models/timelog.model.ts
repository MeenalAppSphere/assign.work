import { User } from '@aavantan-app/models';

export interface TimeLog {
  taskId: string;
  createdBy: User;
  loggedDate: Date;
  loggedTime?: number;
  remainingTime?:number;
  description?:string;
}

