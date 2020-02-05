import { BaseDbModel } from './base.model';

export class TaskType extends BaseDbModel {
  name: string;
  color: string;
  displayName?: string;
  projectId?: string;
}
