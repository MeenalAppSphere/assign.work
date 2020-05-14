import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, Project, UserRoleModel } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { UserRoleUrls } from './user-role.url';
import { cloneDeep } from 'lodash';
import { UserRoleState, UserRoleStore } from '../../../store/user-role/user-role.store';

export class UserRoleService extends BaseService<UserRoleStore, UserRoleState> {
  constructor(protected notification: NzNotificationService,
              protected userRoleStore: UserRoleStore, private _http: HttpWrapperService) {
    super(userRoleStore, notification);

    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  getAllUserRoles(projectId: string) {
    this.updateState({ roles: [], getAllInProcess: true, getAllSuccess: false });
    return this._http.post(UserRoleUrls.getAllUserRoles, { projectId }).pipe(
      map((res: BaseResponseModel<UserRoleModel[]>) => {
        this.updateState({ roles: res.data, getAllInProcess: false, getAllSuccess: true });
      }),
      catchError((e) => {
        this.updateState({ roles: [], getAllInProcess: false, getAllSuccess: false });
        return this.handleError(e);
      })
    );
  }

  createRole(role: UserRoleModel): Observable<BaseResponseModel<Project>> {
    return this._http.post(UserRoleUrls.addRole, role)
      .pipe(
        map(res => {

          // add new created role to store's role array
          this.userRoleStore.update((state) => {
            return {
              ...state,
              addNewSuccess: true,
              addNewInProcess: false,
              roles: [...state.roles, res.data]
            };
          });

          this.notification.success('Success', 'Role Created Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }


  updateRole(taskRole: UserRoleModel): Observable<BaseResponseModel<UserRoleModel>> {
    this.updateState({ updateInProcess: true, updateSuccess: false });
    return this._http.post(UserRoleUrls.updateRole, taskRole).pipe(
      map((res: BaseResponseModel<UserRoleModel>) => {
        this.updateState({ updateInProcess: false, updateSuccess: true });

        this.store.update(state => {

          const preState = cloneDeep(state);
          const index = preState.roles.findIndex((ele)=>ele.id===res.data.id);
          preState.roles[index] = res.data;
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            roles: preState.roles
          };
        });

        this.notification.success('Success', 'Role Updated Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ updateInProcess: false, updateSuccess: false });
        return this.handleError(err);
      })
    );
  }

}
