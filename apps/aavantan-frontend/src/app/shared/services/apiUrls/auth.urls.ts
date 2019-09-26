import { createUrl } from './base.url';

export const AuthUrls = {
  login: `${createUrl('auth/login')}`,
  register: `${createUrl('auth/register')}`
};
