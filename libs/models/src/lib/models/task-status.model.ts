import { BaseDbModel } from './base.model';

export class TaskStatusModel extends BaseDbModel {
  projectId: string;
  name: string;
  isDefault?: boolean;
  description: string;
}
