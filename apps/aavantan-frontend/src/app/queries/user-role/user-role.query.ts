import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { UserRoleState, UserRoleStore } from '../../store/user-role/user-role.store';


@Injectable({ providedIn: 'root' })
export class UserRoleQuery extends Query<UserRoleState> {
  roles$ = this.select(s => s.roles);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  addNewInProcess$ = this.select(s => s.addNewInProcess);
  addNewSuccess$ = this.select(s => s.addNewSuccess);

  updateInProcess$ = this.select(s => s.updateInProcess);
  updateSuccess$ = this.select(s => s.updateSuccess);

  constructor(protected store: UserRoleStore) {
    super(store);
  }
}
