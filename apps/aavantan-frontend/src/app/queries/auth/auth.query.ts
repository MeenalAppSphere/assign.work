import { Query } from '@datorama/akita';
import { AuthState, AuthStore } from '../../store/auth/auth.store';
import { SessionStore } from '../../store/session/session.store';

export class AuthQuery extends Query<AuthState> {
  isLoginInProcess$ = this.select(s => s.isLoginInProcess);
  isLoginSuccess$ = this.select(s => s.isLoginSuccess);
  isRegisterInProcess$ = this.select(s => s.isRegisterInProcess);
  isRegisterIsSuccess$ = this.select(s => s.isRegisterSuccess);

  constructor(protected store: AuthStore) {
    super(store);
  }
}
