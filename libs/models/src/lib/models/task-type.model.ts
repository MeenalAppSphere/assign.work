import { BaseDbModel } from './base.model';

export class TaskTypeModel extends BaseDbModel {
  name: string;
  color: string;
  displayName?: string;
  projectId?: string;
  description: string;
  isDefault?: boolean;
}
