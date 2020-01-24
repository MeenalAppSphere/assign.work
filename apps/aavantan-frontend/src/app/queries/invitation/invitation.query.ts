import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { InvitationState, InvitationStore } from '../../store/invitation/invitation.store';


@Injectable({ providedIn: 'root' })
export class InvitationQuery extends Query<InvitationState> {
  isAcceptInvitationInProcess$ = this.select(s => s.isAcceptInvitationInProcess);
  acceptInvitationSuccess$ = this.select(s => s.acceptInvitationSuccess);

  constructor(protected store: InvitationStore) {
    super(store);
  }
}
