import { createUrl } from '../apiUrls/base.url';

export const UserRoleUrls = {
  getAllUserRoles: createUrl('user-role/get-all'),
  addRole: `${createUrl('user-role/create')}`,
  updateRole: createUrl('user-role/create'),
  changeAccess: createUrl('user/change-access')
};
