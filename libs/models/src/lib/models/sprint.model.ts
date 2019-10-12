import { Task } from './task.model';
export interface DraftSprint {
  ids:String[],
  tasks: Task[];
  duration:number;
}
