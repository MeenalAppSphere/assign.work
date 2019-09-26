import { Query } from '@datorama/akita';
import { AuthState, AuthStore } from '../../store/auth/auth.store';

@Injectable()
export class AuthQuery extends Query<AuthState> {
  isLoginInProcess$ = this.select(s => s.isLoginInProcess);
  isLoginSuccess$ = this.select(s => s.isLoginSuccess);
  isRegisterInProcess$ = this.select(s => s.isRegisterInProcess);
  isRegisterIsSuccess$ = this.select(s => s.isRegisterSuccess);
  token$ = this.select(s => s.user);

  constructor(protected store: AuthStore) {
    super(store);
  }
}
