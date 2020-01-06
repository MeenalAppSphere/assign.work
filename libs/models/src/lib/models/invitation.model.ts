import { Project, User } from '@aavantan-app/models';

export class Invitation {
  invitedById?: string;
  invitedBy?: User;
  invitationToId?: string;
  invitationTo?: User;
  projectId?: string;
  project?: Project;
  isInviteAccepted?: boolean;
  isDeleted?: boolean;
  isExpired?: boolean;
  id?: string;
  _id?: string;
}

export class ResendProjectInvitation {
  id: string;
}
