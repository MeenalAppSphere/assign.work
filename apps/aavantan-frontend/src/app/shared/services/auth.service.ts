import { Injectable } from '@angular/core';
import { AuthState, AuthStore } from '../../store/auth/auth.store';
import {
  BaseResponseModel,
  User,
  UserLoginProviderEnum,
  UserLoginSignUpSuccessResponse,
  UserLoginWithPasswordRequest
} from '@aavantan-app/models';
import { BaseService } from './base.service';
import { HttpWrapperService } from './httpWrapper.service';
import { AuthUrls } from './apiUrls/auth.url';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from './general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { of } from 'rxjs';
import { UserStore } from '../../store/user/user.store';
import { AuthService as SocialAuthService } from 'angularx-social-login';

@Injectable()
export class AuthService extends BaseService<AuthStore, AuthState> {

  constructor(protected authStore: AuthStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService, protected userStore: UserStore, private socialAuthService: SocialAuthService) {
    super(authStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  login(request: UserLoginWithPasswordRequest) {
    this.updateState({ isLoginInProcess: true, isLoginSuccess: false, token: null });
    return this._http.post(AuthUrls.login, request).pipe(
      map((res: BaseResponseModel<UserLoginSignUpSuccessResponse>) => {
        this.updateState({
          isLoginSuccess: true,
          isLoginInProcess: false,
          token: res.data.access_token
        });

        this._generalService.token = res.data.access_token;

        this.router.navigate(['dashboard']);

        return res;
      }),
      catchError(err => {
        this.updateState({
          isLoginSuccess: false,
          isLoginInProcess: false,
          token: null
        });


        this._generalService.token = null;
        return this.handleError(err);
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

        this._generalService.token = res.data.access_token;
        this.router.navigate(['dashboard']);
        return res;
      }),
      catchError((err) => {
        this.updateState({
          isRegisterInProcess: false,
          isRegisterSuccess: false,
          token: null
        });

        this._generalService.token = null;
        this.notification.error('Error', err.error.message);
        return of(err);
      })
    );
  }

  logOut() {
    // if login from social user then please logout from social platforms
    if (this._generalService.user && this._generalService.user.lastLoginProvider === UserLoginProviderEnum.google) {
      // sign out from google then do normal logout process
      this.socialAuthService.signOut(true).then(() => {
        this.doLogout();
      }).catch(err => {
        console.log(err);
      });
    } else {
      // normal login
      this.doLogout();
    }
  }

  private doLogout() {
    this.updateState({ token: null });
    this.userStore.update((state) => {
      return {
        ...state,
        user: null,
        currentOrganization: null,
        currentProject: null
      };
    });
    this.router.navigate(['/login']);
  }

  googleSignIn(token: string, invitationId?: string) {
    this.updateState({ token: null, isLoginInProcess: true, isLoginSuccess: false });
    return this._http.post(AuthUrls.googleSignIn, { token, invitationId }).pipe(
      map((res: BaseResponseModel<UserLoginSignUpSuccessResponse>) => {
        this.updateState({
          isLoginSuccess: true,
          isLoginInProcess: false,
          token: res.data.access_token
        });

        this._generalService.token = res.data.access_token;
        this.router.navigate(['dashboard']);
        return res;
      }),
      catchError(err => {
        this.updateState({
          isLoginSuccess: false,
          isLoginInProcess: false,
          token: null
        });


        this._generalService.token = null;
        return this.handleError(err);
      })
    );
  }
}
