import { Project, User } from '@aavantan-app/models';

export class Invitation {
  invitedById?: string;
  invitedBy?: User;
  invitedToId?: string;
  invitedTo?: User;
  projectId?: string;
  project?: Project;
  isInviteAccepted: boolean;
  isDeleted: boolean;
  id?: string;
  _id: string;
}
