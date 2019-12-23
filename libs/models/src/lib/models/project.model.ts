import { Organization } from './organization.model';
import { Types } from 'mongoose';

import { ProjectTemplateEnum, Sprint, TaskType, User } from '@aavantan-app/models';

export class Project {
  id?: string;
  name: string;
  access?: string;
  version?: string;
  members: ProjectMembers[];
  organization: string | Organization | Types.ObjectId;
  desc?: string;
  avatar?: string;
  progress?: number;
  template: ProjectTemplateEnum;
  createdBy?: string | User;
  updated?: string | User;
  settings?: ProjectSettings;
  sprintId?: string;
  sprint?: Sprint;
}

export class ProjectMembers {
  userId: string;
  emailId: string;
  isEmailSent?: boolean;
  isInviteAccepted?: boolean;
  userDetails?: User;
  workingCapacity?: number;
  workingCapacityPerDay?: number;
  workingDays?: ProjectWorkingDays[];
}

export class ProjectSettings {
  stages: ProjectStages[];
  taskTypes: TaskType[];
  priorities: ProjectPriority[];
  status?: ProjectStatus[];
  tags?: ProjectTags[];
}

export class ProjectStages {
  id?: string;
  name: string;
  alias?: string;
  sequenceNumber?: number;
}

export class ProjectStatus {
  id?: string;
  name: string;
  alias?: string;
}

export interface ProjectPriority {
  id?: string;
  name: string;
  color: string;
}

export class ProjectTags {
  name: string;
  id?: string;
}

export class ProjectWorkingCapacityUpdateDto {
  userId: string;
  workingCapacity: number;
  workingCapacityPerDay?: number;
  workingDays?: ProjectWorkingDays[];
}

export class ProjectWorkingDays {
  day: string;
  selected: boolean;
}

export class SwitchProjectRequest {
  organizationId: string;
  projectId: string;
}

export class SearchProjectRequest {
  organizationId: string;
  query: string;
}

export class SearchProjectTags {
  // organizationId: string;
  projectId: string;
  query: string;
}

export class ProjectStageSequenceChangeRequest {
  projectId: string;
  stageId: string;
  sequenceNo: number;
}

export class SearchProjectCollaborators {
  projectId: string;
  query: string;
}
