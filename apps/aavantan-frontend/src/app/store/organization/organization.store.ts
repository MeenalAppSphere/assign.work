import { Organization } from '@aavantan-app/models';
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface OrganizationState {
  createOrganizationInProcess: boolean;
  createOrganizationSuccess: boolean;
  switchOrganizationInProcess: boolean;
  switchOrganizationSuccess: boolean;
  activeOrganization: Organization;
}

const initialState: OrganizationState = {
  createOrganizationInProcess: false,
  createOrganizationSuccess: false,
  activeOrganization: null,
  switchOrganizationInProcess: false,
  switchOrganizationSuccess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'organization', resettable: true })
export class OrganizationStore extends Store<OrganizationState> {

  constructor() {
    super(initialState);
  }
}
