import { Injectable } from '@angular/core';
import { AuthState, AuthStore } from '../../store/auth/auth.store';
import { User, UserLoginWithPasswordRequest } from '@aavantan-app/models';
import { BaseService } from './base.service';
import { HttpWrapperService } from './httpWrapper.service';
import { AuthUrls } from './apiUrls/auth.urls';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from './general.service';
import { of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthService extends BaseService<AuthStore, AuthState> {

  constructor(protected authStore: AuthStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router) {
    super(authStore);
  }

  login(request: UserLoginWithPasswordRequest) {
    this.updateState({ isLoginInProcess: true, isLoginSuccess: false });
    return this._http.post(AuthUrls.login, request).pipe(
      map(res => {
        this.updateState({ isLoginSuccess: true, isLoginInProcess: false, token: res.access_token });
        this._generalService.token = res.access_token;
        return res;
      }),
      catchError(err => {
        this.updateState({ isLoginSuccess: false, isLoginInProcess: false, token: null });
        this._generalService.token = null;
        return err;
      })
    );
  }

  register(user: User) {
    this.updateState({ isRegisterInProcess: true, isRegisterSuccess: false });
    return this._http.post(AuthUrls.register, user).pipe(
      map(res => {
        this.updateState({ isRegisterSuccess: true, isRegisterInProcess: false, token: res.access_token });
        this._generalService.token = res.access_token;
        return res;
      }),
      catchError(err => {
        this.updateState({ isRegisterInProcess: false, isRegisterSuccess: false, token: null });
        this._generalService.token = null;
        return err;
      })
    );
  }

  requestGoogleRedirectUri() {
    return this._http.get(AuthUrls.googleUriRequest);
  }

  googleSignIn(code) {
    this.updateState({ token: null });
    return this._http.post(AuthUrls.googleSignIn, { code });
  }

  googleSignInSuccess(code: string) {
    this.updateState({ token: code });
    this.router.navigate(['dashboard']);
  }
}
