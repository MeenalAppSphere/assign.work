import { Organization } from './organization.model';
import { Types } from 'mongoose';

import { ProjectTemplateEnum, User } from '@aavantan-app/models';

export class Project {
  id?: string;
  name: string;
  access?: string;
  version?: string;
  members: ProjectMembers[];
  organization: string | Organization | Types.ObjectId;
  desc?: string;
  avatar?: string;
  status?: string;
  progress?: number;
  template: ProjectTemplateEnum;
  createdBy?: string | User;
  updated?: string | User;
}

export class ProjectMembers {
  userId: string;
  emailId: string;
  isEmailSent?: boolean;
  isInviteAccepted?: boolean;
  userDetails?: User;
}
