import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskTypeState, TaskTypeStore } from '../../store/task-type/task-type.store';

@Injectable({ providedIn: 'root' })
export class TaskTypeQuery extends Query<TaskTypeState> {
  types$ = this.select(s => s.types);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  constructor(protected store: TaskTypeStore) {
    super(store);
  }
}
