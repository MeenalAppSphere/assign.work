import { Project } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TaskState {
  tasks: Task[];
}

const initialState: TaskState = {
  tasks: null
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'task', resettable: true })
export class TaskStore extends Store<TaskState> {

  constructor() {
    super(initialState);
  }
}
