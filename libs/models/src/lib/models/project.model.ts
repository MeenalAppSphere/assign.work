import { Organization } from './organization.model';
import { Types } from 'mongoose';

export class Project {
  id?: string;
  name: string;
  access?: string;
  version?: string;
  members: ProjectMembers[];
  organization: string | Organization | Types.ObjectId;
}

export class ProjectMembers {
  userId: string;
  emailId: string;
  isEmailSent: boolean;
  isInviteAccepted: boolean;
}
