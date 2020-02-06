import { TaskStatusModel } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TaskStatusState {
  statuses: TaskStatusModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
}

const initialState: TaskStatusState = {
  statuses: null,
  getAllInProcess: false,
  getAllSuccess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'task-status', resettable: true })

export class TaskStatusStore extends Store<TaskStatusState> {

  constructor() {
    super(initialState);
  }

}
