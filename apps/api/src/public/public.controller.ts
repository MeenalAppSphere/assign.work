import { Controller, Post } from '@nestjs/common';

@Controller('public')
export class PublicController {
  constructor() {
  }

  @Post('resend-project-invitation')
  async resendProjectInvitation() {

  }
}
