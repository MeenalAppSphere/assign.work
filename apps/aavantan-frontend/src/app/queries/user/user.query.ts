import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { UserState, UserStore } from '../../store/user/user.store';
import { ProjectMembers } from '@aavantan-app/models';


@Injectable({ providedIn: 'root' })
export class UserQuery extends Query<UserState> {
  currentProject$ = this.select(s => s.currentProject);
  currentOrganization$ = this.select(s => s.currentOrganization);
  user$ = this.select(s => s.user);
  userRole$ = this.select(s => {
    if(s.currentProject.members && s.currentProject.members.length) {
      const role:ProjectMembers = s.currentProject.members.find(member => member.userId === s.user.id);
      return role.roleDetails;
    }else {
      return false;
    }
  });
  getUserProfileInProcess$ = this.select(s => s.getUserProfileInProcess);

  constructor(protected store: UserStore) {
    super(store);
  }


}
