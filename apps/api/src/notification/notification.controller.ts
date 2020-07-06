import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../shared/services/notification/notification.service';
import { GetNotificationsRequestModel, MarkNotificationAsReadModel } from '@aavantan-app/models';

@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {

  constructor(private readonly _notificationService: NotificationService) {
  }

  @Post('get-all-unread-notifications')
  getAllUnReadNotifications(@Body() dto: GetNotificationsRequestModel) {
    return this._notificationService.getAllUnReadNotifications(dto);
  }

  @Post('mark-notification-as-read')
  markNotificationAsRead(@Body() dto: MarkNotificationAsReadModel) {
    return this._notificationService.markAsRead(dto);
  }
}
