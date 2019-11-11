import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { OrganizationState, OrganizationStore } from '../../../store/organization/organization.store';
import { BaseResponseModel, Organization, User } from '@aavantan-app/models';
import { HttpWrapperService } from '../httpWrapper.service';
import { OrganizationUrls } from './organization.url';
import { catchError, map } from 'rxjs/operators';
import { UserStore } from '../../../store/user/user.store';
import { GeneralService } from '../general.service';
import { Observable, of } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd';

@Injectable()
export class OrganizationService extends BaseService<OrganizationStore, OrganizationState> {

  constructor(private readonly _organizationStore: OrganizationStore, private _httpWrapper: HttpWrapperService,
              private _userStore: UserStore, private _generalService: GeneralService, protected notification: NzNotificationService) {
    super(_organizationStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  createOrganization(org: Organization) {
    this.updateState({ createOrganizationInProcess: true, createOrganizationSuccess: false });
    return this._httpWrapper.post(OrganizationUrls.base, org).pipe(
      map((res: BaseResponseModel<Organization>) => {

        // no organization means it's current organization
        if (!this._generalService.user.organizations.length) {
          this._generalService.currentOrganization = res.data;
        }

        // update user profile
        this._userStore.update(state => {
          return {
            ...state,
            user: Object.assign({}, state.user, {
              organizations: [...state.user.organizations, res.data]
            })
          };
        });

        this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: true });
        return res;
      }),
      catchError(err => {
        this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: false });
        return this.handleError(err);
      })
    );
  }

  getAllUsers(id: string): Observable<BaseResponseModel<User[]>> {
    return this._httpWrapper.get(OrganizationUrls.users.replace(':orgId', id)).pipe(
      map((res) => {
        return res;
      }),
      catchError((err => of(err)))
    );
  }
}
