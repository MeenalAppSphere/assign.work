import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AuthStore } from '../../store/auth/auth.store';
import { OrganizationState, OrganizationStore } from '../../store/organization/organization.store';


@Injectable({ providedIn: 'root' })
export class OrganizationQuery extends Query<OrganizationState> {
  isCreateOrganizationInProcess$ = this.select(s => s.createOrganizationInProcess);
  isCreateOrganizationSuccess$ = this.select(s => s.createOrganizationSuccess);

  constructor(protected store: OrganizationStore) {
    super(store);
  }
}
