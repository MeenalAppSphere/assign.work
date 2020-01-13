import { createUrl } from './base.url';

export const AuthUrls = {
  login: `${createUrl('auth/login')}`,
  register: `${createUrl('auth/register')}`,
  googleUriRequest: `${createUrl('auth/google/uri')}`,
  googleSignIn: `${createUrl('auth/google/validate-token')}`,
};
