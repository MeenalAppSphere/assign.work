import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Project, User } from '@aavantan-app/models';

export interface UserState {
  getUserProfileInProcess: boolean;
  user: User;
  switchProjectInProcess: boolean;
  switchProjectSuccess: boolean;
  currentProject: Project;
}

const initialState: UserState = {
  getUserProfileInProcess: false,
  user: null,
  switchProjectInProcess: false,
  switchProjectSuccess: false,
  currentProject: null
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user', resettable: true })
export class UserStore extends Store<UserState> {
  constructor() {
    super(initialState);
  }
}
