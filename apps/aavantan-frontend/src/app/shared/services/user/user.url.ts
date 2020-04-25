import { createUrl } from '../apiUrls/base.url';

export const UserUrls = {
  search: `${createUrl('user?query=')}`,
  searchUser: `${createUrl('user/search')}`,
  searchUserAddProject: `${createUrl('user/search-user')}`,
  searchProjectCollaborator: `${createUrl('project/search-collaborator')}`,
  profile: `${createUrl('user/profile')}`,
  getAll: `${createUrl('user')}`,
  switchProject: `${createUrl('switch-project')}`,
  uploadProfilePic: `${createUrl('attachment/profilepic')}`,
  changePassword : `${createUrl('user/change-password')}`,
};
