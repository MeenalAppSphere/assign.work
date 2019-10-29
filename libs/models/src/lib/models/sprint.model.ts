import { Task } from './task.model';
import { User } from '@aavantan-app/models';

export interface Sprint {
  id:string,
  name: string;
  duration?:number;
  members?:User[];
}

export interface DraftSprint {
  ids:String[],
  tasks: Task[];
  duration:number;
}
