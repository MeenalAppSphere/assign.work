import { Project, ProjectStatus } from './project.model';
import { User } from './user.model';
import { BaseDbModel } from './base.model';

export class WorkflowModel extends BaseDbModel {
  name: string;
  projectId: string;
  project?: Project;
  columns: WorkflowColumn[];
  isActive: boolean;
}

export class WorkflowColumn extends BaseDbModel {
  name: string;
  statues: string[];
  defaultStatusId: string;
  defaultStatus?: ProjectStatus;
  defaultAssigneeId: string;
  defaultAssignee?: User;
  isActive: boolean;
}
