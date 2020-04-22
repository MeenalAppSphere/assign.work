import { Project, User } from '@aavantan-app/models';

export class Invitation {
  invitedById?: string;
  invitedBy?: User;
  invitationToId?: string;
  invitationToEmailId?: string;
  invitationTo?: User;
  projectId?: string;
  project?: Project;
  isInviteAccepted?: boolean;
  invitedAt?: Date;
  isDeleted?: boolean;
  isExpired?: boolean;
  id?: string;
  _id?: string;
}

export class ResendProjectInvitationModel {
  projectId: string;
  invitedById?: string;
  invitationToEmailId: string;
}

export class RemoveProjectCollaborator {
  collaboratorId: string;
  projectId: string;
  nextCollaboratorId: string;
}

export class InvitationAcceptedModel {
  invitationId: string;
  invitationToEmailId: string;
  projectId: string;
}
