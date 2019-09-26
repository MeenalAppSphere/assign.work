import { OneTimeMessagesDismissed } from './general.model';

export class UserLoginWithPasswordRequest {
  emailId: string;
  password: string;
}

export enum UserStatus {
  'deleted' = 'deleted',
  'blocked' = 'blocked',
  'Active' = 'Active',
  'Left' = 'Left',
  'Expired' = 'Expired'
}

export enum UserLoginProviderEnum {
  'google' = 'google',
  'linkedIn' = 'linkedIn',
  'normal' = 'normal'
}

export enum MemberTypes {
  'alien' = 'alien',
  'normal' = 'normal'
}

export interface UserRecentLoginInfo {
  lastLoggedInTime: string;
}

export class UserTimeZoneInfo {
  timezoneNext: string;
  dateNext: Date;
  offsetNext: number;
  timezoneCurrent: string;
  offsetCurrent: number;
}


export class User {
  emailId: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePic: string;
  lastLoginProvider: UserLoginProviderEnum;
  recentLoginInfo: UserRecentLoginInfo;
  confirmed: boolean;
  memberType: MemberTypes;
  oneTimeMessagesDismissed: OneTimeMessagesDismissed[];
  locale: string;
  timezoneInfo: UserTimeZoneInfo;
  organization: any[];
  projects: any[];
  status: UserStatus;
  mobileNumber: string;
  username: string;
}
