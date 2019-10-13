import { Injectable } from '@angular/core';
import { AuthState, AuthStore } from '../../store/auth/auth.store';
import {
  BaseResponseModel,
  User,
  UserLoginSignUpSuccessResponse,
  UserLoginWithPasswordRequest
} from '@aavantan-app/models';
import { BaseService } from './base.service';
import { HttpWrapperService } from './httpWrapper.service';
import { AuthUrls } from './apiUrls/auth.urls';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from './general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { of } from 'rxjs';
import { UserStore } from '../../store/user/user.store';

@Injectable()
export class AuthService extends BaseService<AuthStore, AuthState> {

  constructor(protected authStore: AuthStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              private notification: NzNotificationService, private userStore: UserStore) {
    super(authStore);
  }

  login(request: UserLoginWithPasswordRequest) {
    this.updateState({ isLoginInProcess: true, isLoginSuccess: false });
    return this._http.post(AuthUrls.login, request).pipe(
      map((res: BaseResponseModel<UserLoginSignUpSuccessResponse>) => {
        this.updateState({
          isLoginSuccess: true,
          isLoginInProcess: false,
          token: res.data.access_token
        });

        this.userStore.update((state => {
          return {
            ...state,
            user: res.data.user
          };
        }));

        this._generalService.token = res.data.access_token;
        this._generalService.user = res.data.user;
        return res;
      }),
      catchError(err => {
        this.updateState({
          isLoginSuccess: false,
          isLoginInProcess: false,
          token: null
        });

        this.userStore.update((state => {
          return {
            ...state,
            user: null
          };
        }));

        this._generalService.token = null;
        this._generalService.user = null;
        this.notification.error('Error', err.error.error.message);
        return of(err);
      })
    );
  }

  register(user: User) {
    this.updateState({ isRegisterInProcess: true, isRegisterSuccess: false });
    return this._http.post(AuthUrls.register, user).pipe(
      map((res: BaseResponseModel<UserLoginSignUpSuccessResponse>) => {

        this.updateState({
          isRegisterSuccess: true,
          isRegisterInProcess: false,
          token: res.data.access_token
        });

        this.userStore.update((state => {
          return {
            ...state,
            user: res.data.user
          };
        }));

        this._generalService.token = res.data.access_token;
        this._generalService.user = res.data.user;
        return res;
      }),
      catchError((err) => {
        this.updateState({
          isRegisterInProcess: false,
          isRegisterSuccess: false,
          token: null
        });

        this.userStore.update((state => {
          return {
            ...state,
            user: null
          };
        }));

        this._generalService.token = null;
        this._generalService.user = null;
        this.notification.error('Error', err.error.error.message);
        return of(err);
      })
    );
  }

  logOut() {
    this.updateState({ token: null });
    this.userStore.update(state => {
      return {
        ...state,
        user: null
      };
    });
    this._generalService.token = null;
    this._generalService.user = null;
    this.router.navigate(['/login']);
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
