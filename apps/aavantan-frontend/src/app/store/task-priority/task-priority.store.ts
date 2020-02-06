import { TaskPriorityModel } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TaskPriorityState {
  priorities: TaskPriorityModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
  addNewInProcess: boolean;
  addNewSuccess: boolean;
  updateInProcess: boolean;
  updateSuccess: boolean;
}

const initialState: TaskPriorityState = {
  priorities: [],
  getAllInProcess: false,
  getAllSuccess: false,
  addNewInProcess: false,
  addNewSuccess: false,
  updateInProcess: false,
  updateSuccess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'task-priority', resettable: true })

export class TaskPriorityStore extends Store<TaskPriorityState> {

  constructor() {
    super(initialState);
  }

}
