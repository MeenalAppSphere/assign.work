import { Project, User } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface ProjectState {
  getUserProfileInProcess: boolean;
  projects: Project[];
  activeProject: Project;
}

const initialState: ProjectState = {
  getUserProfileInProcess: false,
  projects: null,
  activeProject: null
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'project', resettable: true })
export class ProjectStore extends Store<ProjectState> {

  constructor() {
    super(initialState);
  }
}
