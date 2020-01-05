import { BaseService } from './base.service';
import { ClientSession, Document, Model } from 'mongoose';
import { DbCollection, Invitation } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';

export class InvitationService extends BaseService<Invitation & Document> {
  constructor(
    @InjectModel(DbCollection.invitations) protected readonly _invitationModel: Model<Invitation & Document>
  ) {
    super(_invitationModel);
  }

  /**
   * create new invitation in db
   * @param model
   * @param session
   */
  async createInvitation(model: Invitation | Invitation[], session?: ClientSession) {
    if (!session) {
      session = await this.startSession();
    }

    return this.create(Array.isArray(model) ? model : [model], session);
  }
}
