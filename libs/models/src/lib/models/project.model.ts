import { Organization } from './organization.model';
import { Types } from 'mongoose';

import { ProjectTemplateEnum, TaskType, User } from '@aavantan-app/models';

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
  settings?: ProjectSettings;
}

export class ProjectMembers {
  userId: string;
  emailId: string;
  isEmailSent?: boolean;
  isInviteAccepted?: boolean;
  userDetails?: User;
}

export class ProjectSettings {
  stages: ProjectStages[];
  taskTypes: TaskType[];
  priorities: ProjectPriority[];
}

export class ProjectStages {
  id?: string;
  name: string;
  alias?: string;
}

export interface ProjectPriority {
  id?: string;
  name: string;
  color: string;
}
