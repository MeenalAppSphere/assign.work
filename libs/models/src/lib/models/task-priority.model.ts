import { BaseDbModel } from './base.model';

export class TaskPriorityModel extends BaseDbModel {
  name: string;
  color: string;
  projectId?: string;
  description: string;
}
