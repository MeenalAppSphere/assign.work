import { TaskPriorityModel } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TaskPriorityState {
  priorities: TaskPriorityModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
}

const initialState: TaskPriorityState = {
  priorities: null,
  getAllInProcess: false,
  getAllSuccess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'task-priority', resettable: true })

export class TaskPriorityStore extends Store<TaskPriorityState> {

  constructor() {
    super(initialState);
  }

}
