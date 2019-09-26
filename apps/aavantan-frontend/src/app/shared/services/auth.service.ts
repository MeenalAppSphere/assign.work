import { Injectable } from '@angular/core';
import { AuthState, AuthStore } from '../../store/auth/auth.store';
import { UserLoginWithPasswordRequest } from '@aavantan-app/models';
import { BaseService } from './base.service';

@Injectable()
export class AuthService extends BaseService<AuthStore, AuthState> {

  constructor(private authStore: AuthStore) {
    super(authStore);
  }

  login(request: UserLoginWithPasswordRequest) {
    this.updateState({ isLoginInProcess: true, isLoginSuccess: false });
  }
}
