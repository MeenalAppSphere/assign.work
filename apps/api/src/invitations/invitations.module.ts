import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';

@Module({
  controllers: [InvitationController],
  providers: [],
  exports: [],
  imports: []
})
export class InvitationsModule {
}
