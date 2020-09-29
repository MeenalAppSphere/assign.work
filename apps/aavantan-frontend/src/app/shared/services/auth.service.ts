import { Injectable } from '@angular/core';
import { AuthState, AuthStore } from '../../store/auth/auth.store';
import {
  BaseResponseModel,
  ResetPasswordVerifyModel,
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
import { TaskTypeStore } from '../../store/task-type/task-type.store';
import { TaskStatusStore } from '../../store/task-status/task-status.store';
import { TaskPriorityStore } from '../../store/task-priority/task-priority.store';
import { BoardStore } from '../../store/board/board.store';
import { ProjectStore } from '../../store/project/project.store';
import { TaskStore } from '../../store/task/task.store';
import { OrganizationStore } from '../../store/organization/organization.store';
import { SprintStore } from '../../store/sprint/sprint.store';
import { SprintReportStore } from '../../store/sprint-report/sprint-report.store';

@Injectable()
export class AuthService extends BaseService<AuthStore, AuthState> {

  constructor(protected authStore: AuthStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService, protected userStore: UserStore, private socialAuthService: SocialAuthService,
              private taskTypeStore: TaskTypeStore, private taskStatusStore: TaskStatusStore, private taskPriorityStore: TaskPriorityStore,
              private boardStore: BoardStore, private projectStore: ProjectStore, private taskStore: TaskStore,
              private organizationStore: OrganizationStore, private sprintStore: SprintStore, private sprintReportStore: SprintReportStore) {

    super(authStore, notification);
    // this.notification.info("message","suucess",{nzPlacement:'bottomRight'}); 
    // this.notification.config({
    //   nzPlacement: 'bottomRight'
    // });
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
        // if error occurs do a normal logout
        this.doLogout();
      });
    } else {
      // normal login
      this.doLogout();
    }
  }

  forgotPassword(emailId: string) {
    this.updateState({ isForgotPasswordInProcess: true, isForgotPasswordSuccess: false });
    return this._http.post(AuthUrls.forgotPassword, { emailId }).pipe(
      map((res: BaseResponseModel<string>) => {
        this.updateState({ isForgotPasswordInProcess: false, isForgotPasswordSuccess: true });
        this.notification.success('Success', res.data);
      }),
      catchError((err => {
        this.updateState({ isForgotPasswordInProcess: false, isForgotPasswordSuccess: false });
        this.notification.error('Error', err.error.message);
        return of(err);
      }))
    );
  }

  resetPassword(model: ResetPasswordVerifyModel) {
    this.updateState({ isResetPasswordInProcess: true, isResetPasswordSuccess: false });
    return this._http.post(AuthUrls.resetPassword, model).pipe(
      map((res: BaseResponseModel<string>) => {
        this.updateState({ isResetPasswordInProcess: false, isResetPasswordSuccess: true });
        this.notification.success('Success', res.data);
        this.router.navigate(['login']);
      }),
      catchError((err => {
        this.updateState({ isResetPasswordInProcess: false, isResetPasswordSuccess: false });
        this.notification.error('Error', err.error.message);
        return of(err);
      }))
    );
  }

  private doLogout() {
    this.authStore.reset();
    this.userStore.reset();
    this.organizationStore.reset();
    this.projectStore.reset();
    this.boardStore.reset();
    this.sprintStore.reset();
    this.sprintReportStore.reset();
    this.taskStore.reset();
    this.taskTypeStore.reset();
    this.taskStatusStore.reset();
    this.taskPriorityStore.reset();

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
