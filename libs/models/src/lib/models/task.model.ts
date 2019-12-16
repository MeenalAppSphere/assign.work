import { TaskHistoryActionEnum } from '../enums/task.enum';
import { Project, ProjectPriority, ProjectStatus } from './project.model';
import { User } from './user.model';
import { AttachmentModel } from './attachment.model';
import { MongoosePaginateQuery } from '../queryOptions';
import { Sprint } from './sprint.model';

export class Task {
  id?: string;
  name: string;
  displayName?: string;
  description?: string;
  projectId: string;
  project?: Project;
  assigneeId?: string;
  assignee?: User;
  attachments?: string[];
  attachmentsDetails?: AttachmentModel[];
  taskType: any;
  comments?: TaskComments[];
  estimatedTime?: number;
  estimatedTimeReadable?: string;
  remainingTime?: number;
  remainingTimeReadable?: string;
  totalLoggedTime?: number;
  totalLoggedTimeReadable?: string;
  overLoggedTime?: number;
  overLoggedTimeReadable?: string;
  watchers?: string[];
  startedAt?: Date;
  finishedAt?: Date;
  priority?: string | ProjectPriority;
  tags?: string[];
  url?: string;
  progress?: number;
  overProgress?: number;
  status?: string | ProjectStatus;
  sprintId?: string;
  sprint?: Sprint;
  relatedItemId?: string[];
  relatedItem?: Task[];
  dependentItemId?: string;
  dependentItem?: Task;
  createdById: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;
  createdAt?: Date;
  updatedAt?: Date;
  isSelected?: boolean;
  watchersDetails?: User[];
  hasError?:string;
}

export class TaskComments {
  id?: string;
  comment: string;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  attachments?: string[];
  attachmentsDetails?: AttachmentModel[];
  isPinned: boolean;
}

export class TaskHistory {
  taskId: string;
  task?: Task;
  action: TaskHistoryActionEnum;
  createdById: string;
  createdBy?: User;
  createdAt?: Date;
  desc?: string;
}

export class TaskFilterDto {
  id?: string;
  _id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  project?: string | string[];
  assignee?: string | string[];
  taskType?: string | string[];
  priority?: string | string[];
  tags?: string | string[];
  status?: string | string[];
  sprint?: string | string[];
  createdBy?: string | string[];
  sort?: string;
  sortBy?: string;
  startedAt?: Date;
  finishedAt?: Date;
}

export class TaskForSprint extends Task {
  selectedForSprint: boolean = false;
}

export class BaseTaskRequestModel {
  projectId: string;
  taskId?: string;
  displayName?: string;
}

export class GetAllTaskRequestModel extends MongoosePaginateQuery {
  projectId: string;
}

export class GetMyTaskRequestModel extends MongoosePaginateQuery {
  projectId: string;
}

export class GetTaskByIdOrDisplayNameModel extends BaseTaskRequestModel {
}

export class DeleteTaskModel extends BaseTaskRequestModel {
}

export class GetCommentsModel extends BaseTaskRequestModel {
}

export class AddCommentModel extends BaseTaskRequestModel {
  comment: TaskComments;
}

export class UpdateCommentModel extends BaseTaskRequestModel {
  comment: TaskComments;
}

export class DeleteCommentModel extends BaseTaskRequestModel {
  commentId: string;
}

export class CommentPinModel extends BaseTaskRequestModel {
  commentId?: string;
  isPinned?: boolean;
}

export class GetTaskHistoryModel extends MongoosePaginateQuery {
  projectId: string;
  taskId?: string;
}
