import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitationService } from '../shared/services/invitation.service';

@Controller('invitation')
@UseGuards(AuthGuard('jwt'))
export class InvitationController {

  constructor(private readonly _invitationService: InvitationService) {
  }

  @Post('accept-invitation')
  async acceptInvitation(@Body('invitationId') invitationId: string) {
    return await this._invitationService.acceptInvitation(invitationId);
  }
}
