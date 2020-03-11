import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { ProjectState, ProjectStore } from '../../store/project/project.store';


@Injectable({ providedIn: 'root' })
export class ProjectQuery extends Query<ProjectState> {
  createProjectInProcess$ = this.select(s => s.createProjectInProcess);
  createProjectSuccess$ = this.select(s => s.createProjectSuccess);
  projectSwitchInProcess$ = this.select(s => s.projectSwitchInProcess);
  projectSwitchedSuccessfully$ = this.select(s => s.projectSwitchedSuccessfully);

  constructor(protected store: ProjectStore) {
    super(store);
  }
}
