import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskStatusState, TaskStatusStore } from '../../store/task-status/task-status.store';

@Injectable({ providedIn: 'root' })
export class TaskStatusQuery extends Query<TaskStatusState> {
  statuses$ = this.select(s => s.statuses);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  constructor(protected store: TaskStatusStore) {
    super(store);
  }
}
