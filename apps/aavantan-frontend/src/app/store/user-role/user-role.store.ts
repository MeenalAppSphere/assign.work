import { UserRoleModel } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface UserRoleState {
  roles: UserRoleModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
  addNewInProcess: boolean;
  addNewSuccess: boolean;
  updateInProcess: boolean;
  updateSuccess: boolean;
}

const initialState: UserRoleState = {
  roles: [],
  getAllInProcess: false,
  getAllSuccess: false,
  addNewInProcess: false,
  addNewSuccess: false,
  updateInProcess: false,
  updateSuccess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user-role', resettable: true })

export class UserRoleStore extends Store<UserRoleState> {

  constructor() {
    super(initialState);
  }

}
