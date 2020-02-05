import { BaseDbModel } from './base.model';

export class TaskStatusModel extends BaseDbModel {
  projectId: string;
  name: string;
  isCategory?: boolean;
  categoryId?: string;
  category?: TaskStatusModel;
}

export class TaskStatusWithCategoryModel {
  id: string;
  name: string;
  isCategory: boolean;
  statues: Array<Partial<TaskStatusModel>>;
}
