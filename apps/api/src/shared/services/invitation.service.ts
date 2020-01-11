import { BaseService } from './base.service';
import { ClientSession, Document, Model } from 'mongoose';
import { DbCollection, Invitation, MongooseQueryModel } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, OnModuleInit } from '@nestjs/common';
import { invitationExpiryChecker } from '../helpers/helpers';
import { ProjectService } from './project.service';
import { ModuleRef } from '@nestjs/core';

export class InvitationService extends BaseService<Invitation & Document> implements OnModuleInit {

  private _projectService: ProjectService;

  constructor(
    @InjectModel(DbCollection.invitations) protected readonly _invitationModel: Model<Invitation & Document>,
    private _moduleRef: ModuleRef
  ) {
    super(_invitationModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
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
   * accept invitation
   * @param invitationId
   * @param session
   */
  async acceptInvitation(invitationId: string, session?: ClientSession) {
    return await this.update(invitationId, {
      $set: { isInviteAccepted: true, isExpired: true }
    }, session);
  }

  /**
   * get all pending invitations by user email
   */
  async getAllPendingInvitations(emailId: string) {
    const invitations = await this.dbModel.aggregate([{
      $sort: { invitedAt: -1 }
    },
      {
        $match: { invitationToEmailId: emailId, isExpired: false, isInviteAccepted: false }
      }
    ]);

    // filter by project id
    if (invitations && invitations.length) {
      const uniqueInvitations = [];

      for (let i = 0; i < invitations.length; i++) {
        const isDuplicate = uniqueInvitations.some(invitation => invitation.projectId.toString() === invitations[i].projectId.toString());
        if (!isDuplicate) {
          uniqueInvitations.push(invitations[i]);
        }
      }
      return uniqueInvitations;
    } else {
      return [];
    }
  }

  /**
   * expire all previously sent invitation's by emailId and projectId
   * @param emailId
   * @param projectId
   * @param session
   */
  async expireAllPreviousInvitation(emailId: string, session: ClientSession, projectId?: string) {
    const alreadySentInvitationQuery = new MongooseQueryModel();
    alreadySentInvitationQuery.filter = {
      invitationToEmailId: emailId,
      isInviteAccepted: false,
      isExpired: false
    };

    // if project id exits add it to query, it also mean expire only those invitations whose are for this project
    if (projectId) {
      alreadySentInvitationQuery.filter.projectId = projectId;
    }

    // expire all already sent invitations for the current project excluding current invitation
    return await this.bulkUpdate(alreadySentInvitationQuery, {
      $set: {
        isExpired: true
      }
    }, session);
  }

  /**
   * get invitation by id
   */
  async getInvitationDetailsById(id: string) {
    const invitationQuery = new MongooseQueryModel();

    invitationQuery.filter = {
      _id: id
    };
    return this.findOne(invitationQuery);
  }

  /**
   * get invitation full details
   * including project and organization details
   */
  async getFullInvitationDetails(invitationId: string) {
    // get invitation, project and organization details
    const invitations = await this._invitationModel.aggregate([{
      $match: { '_id': this.toObjectId(invitationId) }
    }, {
      $lookup: {
        from: DbCollection.projects,
        let: { 'projectId': '$projectId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$projectId'] } } },
          { $project: { members: 1, organization: 1 } },
          { $project: { 'members.workingCapacity': 0, 'members.workingCapacityPerDay': 0, 'members.workingDays': 0 } }
        ],
        as: 'project'
      }
    }, { $unwind: '$project' },
      {
        $lookup: {
          from: DbCollection.organizations,
          let: { 'organizationId': '$project.organization' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$organizationId'] } } },
            { $project: { members: 1 } }
          ],
          as: 'organization'
        }
      }, { $unwind: '$organization' }
    ]).exec();

    return invitations && invitations.length ? invitations[0] : null;
  }
}
