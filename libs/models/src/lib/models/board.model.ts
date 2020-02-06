import { BaseDbModel } from './base.model';
import { Project, TaskStatusModel, User } from '@aavantan-app/models';

export class BoardColumns {
  headerStatusId: string;
  headerStatus: TaskStatusModel;
  includedStatusesId: string[];
  includedStatuses: TaskStatusModel[];
  isActive: boolean;
  columnOrderNo: number;
  columnColor: string;
  defaultAssigneeId: string;
  defaultAssignee?: User;
}

export class BoardModel extends BaseDbModel {
  name: string;
  projectId: string;
  project?: Project;
  columns;
}
