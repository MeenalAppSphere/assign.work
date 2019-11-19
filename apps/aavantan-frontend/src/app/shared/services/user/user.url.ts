import { createUrl } from '../apiUrls/base.url';

export const UserUrls = {
  search: `${createUrl('user?query=')}`,
  profile: `${createUrl('user/profile')}`,
  getAll: `${createUrl('user')}`,
  switchProject: `${createUrl('switch-project')}`
};
