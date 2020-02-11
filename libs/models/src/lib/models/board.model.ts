import { BaseDbModel } from './base.model';
import { Project, TaskStatusModel, User } from '@aavantan-app/models';

export class BoardColumnIncludedStatus {
  statusId: string;
  status?: TaskStatusModel;
  defaultAssigneeId: string;
  defaultAssignee?: User;
  isShown: boolean;
}

export class BoardColumns {
  headerStatusId: string;
  headerStatus?: TaskStatusModel;
  includedStatuses: BoardColumnIncludedStatus[];
  columnOrderNo: number;
  columnColor: string;
}

export class BoardModelBaseRequest {
  projectId: string;
  boardId: string;
}

export class BoardModel extends BaseDbModel {
  name: string;
  projectId: string;
  project?: Project;
  columns?: BoardColumns[];
}

export class GetActiveBoardRequestModel {
  projectId: string;
  boardId: string;
}

export class BoardMergeStatusToColumn extends BoardModelBaseRequest {
  nextColumnId: string;
  statusId: string;
}

export class BoardMergeColumnToColumn extends BoardModelBaseRequest {
  nextColumnId: string;
  columnId: string;
}

export class BoardAddNewColumnModel extends BoardModelBaseRequest {
  statusId: string;
  columnIndex: number;
}

export class BoardShowColumnStatus extends BoardModelBaseRequest {
  statusId: string;
}

export class BoardHideColumnStatus extends BoardModelBaseRequest {
  columnId: string;
  statusId: string;
}

export class BoardAssignDefaultAssigneeToStatusModel extends BoardModelBaseRequest {
  columnId: string;
  assigneeId: string;
  statusId: string;
}
