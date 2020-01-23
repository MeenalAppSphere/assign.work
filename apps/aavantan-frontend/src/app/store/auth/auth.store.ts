import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';


export interface AuthState {
  isLoginInProcess: boolean;
  isLoginSuccess: boolean;
  isRegisterInProcess: boolean;
  isRegisterSuccess: boolean;
  isForgotPasswordInProcess: boolean;
  isForgotPasswordSuccess: boolean;
  isResetPasswordInProcess: boolean;
  isResetPasswordSuccess: boolean;
  token: string;
}

const initialState: AuthState = {
  isLoginInProcess: false,
  isLoginSuccess: false,
  isRegisterInProcess: false,
  isRegisterSuccess: false,
  isForgotPasswordInProcess: false,
  isForgotPasswordSuccess: false,
  isResetPasswordInProcess: false,
  isResetPasswordSuccess: false,
  token: null,
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth', resettable: true })
export class AuthStore extends Store<AuthState> {
  constructor() {
    super(initialState);
  }
}
