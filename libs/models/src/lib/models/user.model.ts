import { MemberTypes, OneTimeMessagesDismissed } from '../general';
import { UserLoginProviderEnum, UserStatus } from '../enums';
import { Organization } from './organization.model';
import { Project } from './project.model';

export class UserLoginWithPasswordRequest {
  emailId: string;
  password: string;
}

export class UserLoginSignUpSuccessResponse {
  access_token: string;
  user: User;
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
  id?:string;
  emailId?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profilePic?: string;
  lastLoginProvider?: UserLoginProviderEnum;
  recentLoginInfo?: UserRecentLoginInfo;
  confirmed?: boolean;
  memberType?: MemberTypes;
  oneTimeMessagesDismissed?: OneTimeMessagesDismissed[];
  locale?: string;
  timezoneInfo?: UserTimeZoneInfo;
  organizations?: string[] | Organization[];
  projects?: string[] | Project[];
  defaultOrganization?: string;
  currentProject?: Project;
  status?: UserStatus;
  mobileNumber?: string;
  username?: string;
  isEmailSent?:boolean;
}
