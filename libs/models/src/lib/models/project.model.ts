export class Project {
  name: string;
  access?: string;
  version?: string;
  members: ProjectMembers[];
}

export class ProjectMembers {
  userId: string;
  emailId: string;
  isEmailSent: boolean;
  isInviteAccepted: boolean;
}
