import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AuthState, AuthStore } from '../../store/auth/auth.store';


@Injectable({ providedIn: 'root' })
export class AuthQuery extends Query<AuthState> {
  isLoginInProcess$ = this.select(s => s.isLoginInProcess);
  isLoginSuccess$ = this.select(s => s.isLoginSuccess);
  isRegisterInProcess$ = this.select(s => s.isRegisterInProcess);
  isRegisterIsSuccess$ = this.select(s => s.isRegisterSuccess);
  token$ = this.select(s => s.token);

  constructor(protected store: AuthStore) {
    super(store);
  }
}
