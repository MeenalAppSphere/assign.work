import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AuthState, AuthStore } from '../../store/auth/auth.store';


@Injectable({ providedIn: 'root' })
export class AuthQuery extends Query<AuthState> {
  isLoginInProcess$ = this.select(s => s.isLoginInProcess);
  isLoginSuccess$ = this.select(s => s.isLoginSuccess);
  isRegisterInProcess$ = this.select(s => s.isRegisterInProcess);
  isRegisterIsSuccess$ = this.select(s => s.isRegisterSuccess);
  isForgotPasswordInProcess$ = this.select(s => s.isForgotPasswordInProcess);
  isForgotPasswordSuccess$ = this.select(s => s.isForgotPasswordSuccess);
  isResetPasswordInProcess$ = this.select(s => s.isResetPasswordInProcess);
  isResetPasswordSuccess$ = this.select(s => s.isResetPasswordSuccess);
  token$ = this.select(s => s.token);

  constructor(protected store: AuthStore) {
    super(store);
  }
}
