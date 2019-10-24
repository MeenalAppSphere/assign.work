import { Project } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface ProjectState {
  projects: Project[];
}

const initialState: ProjectState = {
  projects: null
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'project', resettable: true })
export class ProjectStore extends Store<ProjectState> {

  constructor() {
    super(initialState);
  }
}
