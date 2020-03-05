import { Task } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TaskState {
  tasks: Task[];
  getTaskInProcess: boolean;
  getTaskSuccess: boolean;
  createNewTaskAction: boolean;
}

const initialState: TaskState = {
  tasks: null,
  getTaskInProcess: false,
  getTaskSuccess: false,
  createNewTaskAction: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'task', resettable: true })

export class TaskStore extends Store<TaskState> {

  constructor() {
    super(initialState);
  }

}
