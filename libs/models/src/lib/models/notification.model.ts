import { BaseDbModel } from './base.model';
import { Project } from './project.model';
import { User } from './user.model';
import { MongoosePaginateQuery } from '../queryOptions';

export class NotificationResponseModel {
  msg: string;
  link: string;
  projectId?: string;
  projectName?: string;
}

export class Notification extends BaseDbModel {
  projectId: string;
  project?: Project;
  userId: string;
  user?: User;
  description: string;
  isRead: boolean;
  link: string;
}

export class MarkNotificationAsReadModel {
  notificationIds: string[];
  projectId: string;
}

export class GetNotificationsRequestModel extends MongoosePaginateQuery {
}
