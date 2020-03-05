import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TaskState, TaskStore  } from '../../store/task/task.store';


@Injectable({ providedIn: 'root' })
export class TaskQuery extends Query<TaskState> {
  tasks$ = this.select(s => s.tasks);
  createNewTaskAction$ = this.select(s => s.createNewTaskAction);

  constructor(protected store: TaskStore) {
    super(store);
  }
}
