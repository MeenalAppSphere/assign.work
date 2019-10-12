import { User } from '@aavantan-app/models';

export class Project {
  id?:string;
  name: string;
  access?: string;
  version?: string;
  members: ProjectMembers[];
  desc?: string;
  avatar?: string;
  status?: string;
  progress?: number;
}

export class ProjectMembers {
  userId: string;
  emailId: string;
  isEmailSent: boolean;
  isInviteAccepted: boolean;
  userDetails?:User
}
