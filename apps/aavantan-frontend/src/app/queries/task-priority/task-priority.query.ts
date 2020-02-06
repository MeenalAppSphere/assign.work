import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskPriorityState, TaskPriorityStore } from '../../store/task-priority/task-priority.store';


@Injectable({ providedIn: 'root' })
export class TaskPriorityQuery extends Query<TaskPriorityState> {
  priorities$ = this.select(s => s.priorities);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  constructor(protected store: TaskPriorityStore) {
    super(store);
  }
}
