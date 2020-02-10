import { BaseDbModel } from './base.model';
import { Project, TaskStatusModel, User } from '@aavantan-app/models';

export class BoardColumns {
  headerStatusId: string;
  headerStatus?: TaskStatusModel;
  includedStatusesId: string[];
  includedStatuses?: TaskStatusModel[];
  isActive: boolean;
  columnOrderNo: number;
  columnColor: string;
  defaultAssigneeId: string;
  defaultAssignee?: User;
}

export class BoardModelBaseRequest {
  projectId: string;
  boardId: string;
}

export class BoardModel extends BaseDbModel {
  name: string;
  projectId: string;
  project?: Project;
  columns: BoardColumns[];
}

export class GetActiveBoardRequestModel {
  projectId: string;
  boardId: string;
}

export class MoveStatusToBoardModel extends BoardModelBaseRequest {
  statusId: string;
  columnId: string;
}

export class BoardAddNewColumnModel extends BoardModelBaseRequest {
  statusId: string;
  columnIndex: number;
}

export class BoardShowHideColumn extends BoardModelBaseRequest {
  columnId: string;
  isShown: boolean;
}

export class BoardAssignDefaultAssigneeToStatusModel extends BoardModelBaseRequest {
  columnId: string;
  assigneeId: string;
  statusId: string;
}
