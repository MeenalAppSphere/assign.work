import { createUrl } from '../apiUrls/base.url';

export const OrganizationUrls = {
  base: `${createUrl('organization')}`,
  users: `${createUrl('organization/users?orgId=:orgId')}`
};
