import { Injectable } from '@angular/core';
import { BaseResponseModel, User, UserLoginSignUpSuccessResponse } from '@aavantan-app/models';
import { BaseService } from './base.service';
import { HttpWrapperService } from './httpWrapper.service';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from './general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { of } from 'rxjs';
import { UserState, UserStore } from '../../store/user/user.store';
import { UserUrls } from './apiUrls/user.url';

@Injectable()
export class UserService extends BaseService<UserStore, UserState> {

  constructor(protected userStore: UserStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              private notification: NzNotificationService) {
    super(userStore);
  }

  getProfile() {
    this.updateState({ getUserProfileInProcess: true });
    return this._http.get(UserUrls.profile).pipe(
      map((res: BaseResponseModel<User>) => {
        this.updateState({
          getUserProfileInProcess: false,
          user: res.data
        });
        this._generalService.user = res.data;
        return res;
      }),
      catchError(err => {
        this.updateState({
          getUserProfileInProcess: false,
          user: null
        });
        this._generalService.user = null;
        this.notification.error('Error', err.error.error.message);
        return of(err);
      })
    );
  }
}
