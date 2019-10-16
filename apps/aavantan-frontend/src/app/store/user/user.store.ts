import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { User } from '@aavantan-app/models';

export interface UserState {
  getUserProfileInProcess: boolean;
  user: User;
}

const initialState: UserState = {
  getUserProfileInProcess: false,
  user: null
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user', resettable: true })
export class UserStore extends Store<UserState> {
  constructor() {
    super(initialState);
  }
}
