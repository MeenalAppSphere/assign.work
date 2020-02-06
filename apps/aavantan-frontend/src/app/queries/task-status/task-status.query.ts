import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskStatusState, TaskStatusStore } from '../../store/task-status/task-status.store';

@Injectable({ providedIn: 'root' })
export class TaskStatusQuery extends Query<TaskStatusState> {
  statuses$ = this.select(s => s.statuses);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  addNewInProcess$ = this.select(s => s.addNewInProcess);
  addNewSuccess$ = this.select(s => s.addNewSuccess);

  updateInProcess$ = this.select(s => s.updateInProcess);
  updateSuccess$ = this.select(s => s.updateSuccess);

  constructor(protected store: TaskStatusStore) {
    super(store);
  }
}
