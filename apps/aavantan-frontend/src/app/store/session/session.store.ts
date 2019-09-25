import { Store, StoreConfig } from '@datorama/akita';
import { User } from '@aavantan-app/models';

export interface SessionState {
  token: string;
  user: User;
}

const initialState: SessionState = {
  token: '',
  user: undefined
};

@StoreConfig({ name: 'session', resettable: true })
export class SessionStore extends Store<SessionState> {
  constructor() {
    super(initialState);
  }
}
