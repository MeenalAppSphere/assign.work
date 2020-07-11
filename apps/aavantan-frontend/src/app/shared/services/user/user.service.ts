import { Injectable } from '@angular/core';
import {
  AccessRoleGroupEnum,
  BaseResponseModel, ChangePasswordModel, ProjectMembers,
  SearchProjectCollaborators,
  SearchUserModel,
  User
} from '@aavantan-app/models';
import { BaseService } from '../base.service';
import { HttpWrapperService } from '../httpWrapper.service';
import { catchError, map } from 'rxjs/operators';
import { GeneralService } from '../general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { Observable, of } from 'rxjs';
import { UserState, UserStore } from '../../../store/user/user.store';
import { UserUrls } from './user.url';
import { NgxPermissionsService } from 'ngx-permissions';
import { cloneDeep} from 'lodash';

@Injectable()
export class UserService extends BaseService<UserStore, UserState> {

  constructor(protected userStore: UserStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService, private permissionsService: NgxPermissionsService) {
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
        this.setPermissions(res.data);
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

  searchAddPojectUser(json: SearchUserModel): Observable<BaseResponseModel<User[]>> {
    return this._http.post(UserUrls.searchUser, json).pipe(
      map((res: BaseResponseModel<User[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  searchOrgUser(json: SearchUserModel): Observable<BaseResponseModel<User[]>> {
    return this._http.post(UserUrls.searchUser, json).pipe(
      map((res: BaseResponseModel<User[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  searchProjectCollaborator(json: SearchProjectCollaborators): Observable<BaseResponseModel<User[]>> {
    return this._http.post(UserUrls.searchProjectCollaborator, json).pipe(
      map((res: BaseResponseModel<User[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  changePassword(json: ChangePasswordModel) {
    return this._http.post(UserUrls.changePassword, json).pipe(
      map((res: BaseResponseModel<string>) => {
        this.notification.success('Success', res.data);
        this.router.navigate(['login']);
        return res;
      }),
      catchError((err => {
        return this.handleError(err);
      }))
    );
  }

  public setPermissions(profile:User) {
    if(profile.currentProject) {
      const permissionsList = [];
      const role: ProjectMembers = profile.currentProject.members.find(member => member.userId === profile.id);
      const recur = (obj: any, group: string) => {
        Object.keys(obj).forEach(key => {
          if (obj[key]) {
            permissionsList.push(key);

            // if group related to setting and access is true then haveSettingsRelatedAccess
            if (!permissionsList.includes('canView_settingsMenu') && (group === AccessRoleGroupEnum.project || group === AccessRoleGroupEnum.boardSettings || group === AccessRoleGroupEnum.collaborators
              || group === AccessRoleGroupEnum.status || group === AccessRoleGroupEnum.priority ||
              group === AccessRoleGroupEnum.taskType || group === AccessRoleGroupEnum.teamCapacity)) {
              permissionsList.push('canView_settingsMenu'); // 'canView_settingsMenu' is not is Permission.ts
            }
          }
        });
      };

      Object.keys(role.roleDetails.accessPermissions).forEach(key => {
        if (typeof role.roleDetails.accessPermissions[key] !== 'boolean') {
          recur(role.roleDetails.accessPermissions[key], key);
        }
      });
      this._generalService.permissions = cloneDeep(permissionsList);
      this.permissionsService.loadPermissions(permissionsList);
    }
  }

}
