import { BaseDbModel } from './base.model';
import { User } from './user.model';

export class TaskTypeModel extends BaseDbModel {
  name: string;
  color: string;
  displayName?: string;
  projectId: string;
  description?: string;
  isDefault?: boolean;
  assigneeId: string;
  assignee?: User;
}
