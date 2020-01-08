import { BaseService } from './base.service';
import { ClientSession, Document, Model } from 'mongoose';
import { DbCollection, Invitation, MongooseQueryModel } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, OnModuleInit } from '@nestjs/common';
import { invitationExpiryChecker } from '../helpers/helpers';

export class InvitationService extends BaseService<Invitation & Document> implements OnModuleInit {
  constructor(
    @InjectModel(DbCollection.invitations) protected readonly _invitationModel: Model<Invitation & Document>
  ) {
    super(_invitationModel);
  }

  onModuleInit(): any {

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

  /**
   * expire one or multiple invitations
   * @param invitationIds
   * @param session
   */
  async expireInvitation(invitationIds: string | string[], session: ClientSession) {
    const filter = {
      _id: { $in: Array.isArray(invitationIds) ? invitationIds : [invitationIds] }
    };
    const updateObject = {
      isExpired: true
    };
    return this.bulkUpdate(filter, updateObject, session);
  }

  /**
   * check invitation expired or not
   * @param id
   */
  async checkInvitationExpired(id: string) {
    const query = new MongooseQueryModel();
    query.filter = {
      _id: id
    };
    query.lean = true;

    const invitationDetails = await this.findOne(query);
    if (!invitationDetails) {
      throw new BadRequestException('Invalid invitation link');
    }

    return invitationExpiryChecker(invitationDetails.invitedAt);
  }

  /**
   * get invitation by id
   */
  async getInvitationDetailsById(id: string) {
    const invitationQuery = new MongooseQueryModel();

    invitationQuery.filter = {
      id: id
    };
    return this.findOne(invitationQuery);
  }

}
