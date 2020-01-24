import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { InvitationState, InvitationStore } from '../../../store/invitation/invitation.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { InvitationsUrls } from './invitation.url';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel } from '@aavantan-app/models';
import { UserService } from '../user/user.service';

@Injectable()
export class InvitationService extends BaseService<InvitationStore, InvitationState> {
  constructor(private readonly _invitationStore: InvitationStore, private _httpWrapper: HttpWrapperService,
              private _generalService: GeneralService, protected notification: NzNotificationService,
              private _userService: UserService) {
    super(_invitationStore, notification);

    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  acceptInvitation(invitationId: string) {
    this.updateState({ isAcceptInvitationInProcess: true, acceptInvitationSuccess: false });
    return this._httpWrapper.post(InvitationsUrls.acceptInvitation, { invitationId }).pipe(
      map((res: BaseResponseModel<string>) => {
        this.notification.success('Success', res.data);
      }),
      catchError(err => this.handleError(err))
    );
  }
}
