import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface InvitationState {
  isAcceptInvitationInProcess: boolean;
  acceptInvitationSuccess: boolean;
}

const initialState: InvitationState = {
  isAcceptInvitationInProcess: false,
  acceptInvitationSuccess: false,
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'invitation', resettable: true })
export class InvitationStore extends Store<InvitationState> {

  constructor() {
    super(initialState);
  }
}
