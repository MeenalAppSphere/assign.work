import { Organization } from './organization.model';

import {
  BoardModel,
  ProjectTemplateEnum,
  Sprint,
  TaskPriorityModel,
  TaskStatusModel,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
import { MongoosePaginateQuery } from '../queryOptions';
import { BaseDbModel } from './base.model';

export class Project extends BaseDbModel {
  name: string;
  access?: string;
  version?: string;
  members: ProjectMembers[];
  organization: Organization;
  organizationId?: string;
  description?: string;
  avatar?: string;
  progress?: number;
  template: ProjectTemplateEnum;
  createdBy?: User;
  createdById?: string;
  updatedBy?: User;
  updatedById?: string;
  updated?: string | User;
  settings?: ProjectSettings;
  sprintId?: string;
  sprint?: Sprint;
  activeBoardId?: string;
  activeBoard?: BoardModel;
  color?: string;
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
  stages?: ProjectStages[];
  taskTypes: TaskTypeModel[];
  priorities: TaskPriorityModel[];
  statuses?: TaskStatusModel[];
  tags?: ProjectTags[];
  defaultTaskTypeId?: string;
  defaultTaskType?: TaskTypeModel;
  defaultTaskStatusId?: string;
  defaultTaskStatus?: TaskTypeModel;
  defaultTaskPriorityId?: string;
  defaultTaskPriority?: TaskTypeModel;
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

export class GetAllProjectsModel extends MongoosePaginateQuery {
  organizationId: string;
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

export class ProjectTemplateUpdateModel {
  projectId: string;
  template: ProjectTemplateEnum;
}

export class ProjectUpdateDefaultAssigneeModel {
  projectId: string;
  assigneeId: string;
}

export class ProjectUpdateDefaultTaskTypeModel {
  projectId: string;
  taskTypeId: string;
}

export class ProjectUpdateDefaultPriorityModel {
  projectId: string;
  taskPriorityId: string;
}

export class ProjectUpdateDefaultTaskStatusModel {
  projectId: string;
  taskStatusId: string;
}

export class UpdateProjectRequestModel {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  defaultTaskTypeId: string;
  defaultTaskStatusId: string;
  defaultTaskPriorityId: string;
}
