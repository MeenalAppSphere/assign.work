import { Project } from './project.model';
import { User } from './user.model';
import { BaseDbModel } from './base.model';

export class WorkflowModel extends BaseDbModel {
  name: string;
  projectId: string;
  project?: Project;
  statuses: WorkflowStatuses[];
  isActive: boolean;
  categoryOrder: string[];
}

export class WorkflowStatuses extends BaseDbModel {
  status: string;
  defaultAssigneeId: string;
  defaultAssignee?: User;
}
