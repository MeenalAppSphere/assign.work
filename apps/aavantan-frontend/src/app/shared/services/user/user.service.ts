import { Injectable } from '@angular/core';
import { BaseResponseModel, User } from '@aavantan-app/models';
import { BaseService } from '../base.service';
import { HttpWrapperService } from '../httpWrapper.service';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from '../general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { Observable, of } from 'rxjs';
import { UserState, UserStore } from '../../../store/user/user.store';
import { UserUrls } from './user.url';

@Injectable()
export class UserService extends BaseService<UserStore, UserState> {

  constructor(protected userStore: UserStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService) {
    super(userStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  getProfile() {
    this.updateState({ getUserProfileInProcess: true });
    return this._http.get(UserUrls.profile).pipe(
      map((res: BaseResponseModel<User>) => {
        this.updateState({
          getUserProfileInProcess: false,
          user: res.data,
          currentProject: res.data.currentProject,
          currentOrganization: res.data.currentOrganization
        });
        return res;
      }),
      catchError(err => {
        this.updateState({
          getUserProfileInProcess: false,
          user: null,
          currentProject: null,
          currentOrganization: null
        });
        this.notification.error('Error', err.error.error.message);
        return of(err);
      })
    );
  }

  getAllUsers(): Observable<BaseResponseModel<User[]>> {
    return this._http.get(UserUrls.getAll).pipe(
      map(res => {
        return res;
      }),
      catchError(err => {
        return of(err);
      })
    );
  }

  searchUser(text: string): Observable<BaseResponseModel<User[]>> {
    return this._http.get(UserUrls.search + text).pipe(
      map((res: BaseResponseModel<User[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

}
