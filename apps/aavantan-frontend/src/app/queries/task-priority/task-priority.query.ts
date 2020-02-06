import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskPriorityState, TaskPriorityStore } from '../../store/task-priority/task-priority.store';


@Injectable({ providedIn: 'root' })
export class TaskPriorityQuery extends Query<TaskPriorityState> {
  priorities$ = this.select(s => s.priorities);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  addNewInProcess$ = this.select(s => s.addNewInProcess);
  addNewSuccess$ = this.select(s => s.addNewSuccess);

  updateInProcess$ = this.select(s => s.updateInProcess);
  updateSuccess$ = this.select(s => s.updateSuccess);

  constructor(protected store: TaskPriorityStore) {
    super(store);
  }
}
