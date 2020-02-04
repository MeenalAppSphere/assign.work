import { BaseDbModel } from './base.model';

export class TaskStatusModel extends BaseDbModel {
  projectId: string;
  name: string;
  categoryId?: string;
  category?: TaskStatusModel;
}
