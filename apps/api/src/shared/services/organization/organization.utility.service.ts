import { Organization } from '@aavantan-app/models';
import { BadRequest, maxLengthValidator, validOrganizationOrProjectName } from '../../helpers/helpers';

export class OrganizationUtilityService {
  constructor() {
  }

  /**
   * check validation's for create organization request
   * @param organization
   */
  createOrganizationValidation(organization: Organization) {
    if (!organization) {
      BadRequest('invalid request, organization name is required');
    }

    if (!organization.name) {
      BadRequest('invalid request, organization name is required');
    }

    if (!validOrganizationOrProjectName(organization.name)) {
      BadRequest('invalid organization name');
    }

    if (!maxLengthValidator(organization.name, 250)) {
      BadRequest('organization name should not be grater than 250 characters');
    }
  }
}
