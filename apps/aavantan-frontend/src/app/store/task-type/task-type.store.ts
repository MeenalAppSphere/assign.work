import { TaskTypeModel } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TaskTypeState {
  types: TaskTypeModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
  addNewInProcess: boolean;
  addNewSuccess: boolean;
  updateInProcess: boolean;
  updateSuccess: boolean;
}

const initialState: TaskTypeState = {
  types: null,
  getAllInProcess: false,
  getAllSuccess: false,
  addNewInProcess: false,
  addNewSuccess: false,
  updateInProcess: false,
  updateSuccess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'task-type', resettable: true })

export class TaskTypeStore extends Store<TaskTypeState> {

  constructor() {
    super(initialState);
  }

}
