import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { OrganizationState, OrganizationStore } from '../../store/organization/organization.store';
import { BaseResponseModel, Organization, User } from '@aavantan-app/models';
import { HttpWrapperService } from './httpWrapper.service';
import { OrganizationUrls } from './apiUrls/organization.url';
import { catchError, map } from 'rxjs/operators';
import { UserStore } from '../../store/user/user.store';
import { GeneralService } from './general.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class OrganizationService extends BaseService<OrganizationStore, OrganizationState> {

  constructor(private readonly _organizationStore: OrganizationStore, private _httpWrapper: HttpWrapperService,
              private _userStore: UserStore, private _generalService: GeneralService) {
    super(_organizationStore);
  }

  createOrganization(org: Organization) {
    this.updateState({ createOrganizationInProcess: true, createOrganizationSuccess: false });
    return this._httpWrapper.post(OrganizationUrls.base, org).pipe(
      map((res: BaseResponseModel<Organization>) => {
        this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: true });

        // update user profile
        this._userStore.update(state => {
          return {
            ...state,
            user: Object.assign({}, state.user, {
              organizations: [...state.user.organizations, res.data]
            })
          };
        });
        this._generalService.user = {
          ...this._generalService.user,
          organizations: [...this._generalService.user.organizations, res.data as any]
        };
        return res;
      }),
      catchError(err => {
        this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: false });
        return of(err);
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
