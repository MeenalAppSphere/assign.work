import { BaseDbModel } from './base.model';

export class TaskStatusModel extends BaseDbModel {
  projectId: string;
  name: string;
  isDefault?: boolean;
  description: string;
}

export class DeleteStatusModel {
  projectId: string;
  statusId: string;
  nextStatusId?: string;
  haveTasks?: boolean;
}

export class StatusDDLModel {
  value: string;
  label: string;
  checked: boolean;
}
