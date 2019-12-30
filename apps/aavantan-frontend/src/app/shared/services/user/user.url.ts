import { createUrl } from '../apiUrls/base.url';

export const UserUrls = {
  search: `${createUrl('user?query=')}`,
  searchProjectCollaborator: `${createUrl('project/search-collaborator')}`,
  profile: `${createUrl('user/profile')}`,
  getAll: `${createUrl('user')}`,
  switchProject: `${createUrl('switch-project')}`
};
