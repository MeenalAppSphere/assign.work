import { Injectable } from '@nestjs/common';
import { BaseService } from '../base.service';
import {
  BasePaginatedResponse,
  DbCollection,
  GetNotificationsRequestModel,
  MarkNotificationAsReadModel,
  Notification
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ProjectService } from '../project/project.service';
import { GeneralService } from '../general.service';

@Injectable()
export class NotificationService extends BaseService<Notification & Document> {
  constructor(
    @InjectModel(DbCollection.sprintReports) protected readonly _notificationModel: Model<Notification & Document>,
    protected readonly _projectService: ProjectService, private _generalService: GeneralService
  ) {
    super(_notificationModel);
  }

  /**
   * create new notification
   * @param {Notification} dto
   * @param projectId
   * @return {Promise<any>}
   */
  createNotification(dto: Notification[], projectId: string) {
    return this.withRetrySession(async (session: ClientSession) => {
      // get project details
      await this._projectService.getProjectDetails(projectId);

      // create notifications
      return await this.createMany(dto, session);
    });
  }

  /**
   * mark notification as read
   * @param {MarkNotificationAsReadModel} dto
   * @return {Promise<any>}
   */
  markAsRead(dto: MarkNotificationAsReadModel) {
    return this.withRetrySession(async (session: ClientSession) => {
      const projectDetails = await this._projectService.getProjectDetails(dto.projectId);
      const updateQuery = {
        _id: { $in: dto.notificationIds }
      };

      await this.bulkUpdate(updateQuery, { isRead: true }, session);

      return 'Notifications marked as read successfully';
    });
  }

  /**
   * get all un read notifications
   * @param {GetNotificationsRequestModel} dto
   * @return {Promise<BasePaginatedResponse<Notification>>}
   */
  async getAllUnReadNotifications(dto: GetNotificationsRequestModel) {
    try {

      // populate essential columns
      dto.populate = [{
        path: 'user',
        select: 'emailId userName firstName lastName profilePic _id',
        justOne: true
      }, {
        path: 'project',
        select: 'name',
        justOne: true
      }];

      // get paginated result
      const result: BasePaginatedResponse<Notification> = await this.getAllPaginatedData({
        userId: this._generalService.userId, isRead: false
      }, dto);

      // map over result
      result.items = result.items.map(notification => {
        notification.id = notification._id.toString();
        return notification;
      });

      return result;
    } catch (e) {
      throw e;
    }
  }
}
