import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskTypeState, TaskTypeStore } from '../../store/task-type/task-type.store';

@Injectable({ providedIn: 'root' })
export class TaskTypeQuery extends Query<TaskTypeState> {
  types$ = this.select(s => s.types);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  addNewInProcess$ = this.select(s => s.addNewInProcess);
  addNewSuccess$ = this.select(s => s.addNewSuccess);

  updateInProcess$ = this.select(s => s.updateInProcess);
  updateSuccess$ = this.select(s => s.updateSuccess);

  constructor(protected store: TaskTypeStore) {
    super(store);
  }
}
