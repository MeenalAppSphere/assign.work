import { BaseService } from './base.service';
import { ClientSession, Document, Model } from 'mongoose';
import { DbCollection, Invitation, MongooseQueryModel, Organization, Project, User } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, OnModuleInit } from '@nestjs/common';
import { isInvitationExpired } from '../helpers/helpers';
import { ProjectService } from './project.service';
import { ModuleRef } from '@nestjs/core';
import { OrganizationService } from './organization.service';
import { UsersService } from './users.service';
import { GeneralService } from './general.service';

export class InvitationService extends BaseService<Invitation & Document> implements OnModuleInit {

  private _userService: UsersService;
  private _projectService: ProjectService;
  private _organizationService: OrganizationService;

  constructor(
    @InjectModel(DbCollection.invitations) protected readonly _invitationModel: Model<Invitation & Document>,
    private _moduleRef: ModuleRef, private _generalService: GeneralService
  ) {
    super(_invitationModel);
  }

  onModuleInit(): any {
    this._userService = this._moduleRef.get('UsersService');
    this._projectService = this._moduleRef.get('ProjectService');
    this._organizationService = this._moduleRef.get('OrganizationService');
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
   * accept invitation
   * check if invitation is valid or not
   * accept invitation and update user project, organizations
   * expire all invitation of that user
   * return success message
   * @param invitationId
   */
  async acceptInvitation(invitationId: string) {
    if (!invitationId) {
      throw new BadRequestException('Invalid invitation link');
    }

    // start db session
    const session = await this.startSession();

    try {
      // get invitation details
      const invitationDetails = await this.getFullInvitationDetails(invitationId);

      // check invitation link validations
      if (!invitationDetails) {
        throw new BadRequestException('Invalid invitation link');
      } else {
        // invitation is expired
        if (isInvitationExpired(invitationDetails.invitedAt)) {
          throw new BadRequestException('Invitation link has been expired! please request a new one');
        }

        if (invitationDetails.invitationToId.toString() !== this._generalService.userId) {
          throw new BadRequestException('Invalid invitation link');
        }
      }

      const userDetails = await this._userService.findById(invitationDetails.invitationToId);

      // now everything seems ok start invitation accepting process
      // accept invitation and update project, organization and invitation
      await this.acceptInvitationUpdateDbProcess(invitationDetails.project, session, invitationDetails.organization, userDetails, invitationId);

      // update user with model and set organization
      await this._userService.updateById(userDetails._id.toString(), {
        $set: {
          currentOrganizationId: invitationDetails.organization._id.toString(),
          currentProject: invitationDetails.project._id.toString()
        },
        $push: {
          organizations: invitationDetails.organization._id.toString(),
          projects: invitationDetails.project._id.toString()
        }
      }, session);

      // expire all already sent invitations
      await this.expireAllPreviousInvitation(userDetails.emailId, session);
      await this.commitTransaction(session);
      return 'Invitation accepted successfully';
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * accept invitation update db process
   * update all essential db collections needed for accepting an invitation
   * update project, update organization
   * accept invitation, expire all already sent invitations
   * @param projectDetails
   * @param session
   * @param organizationDetails
   * @param userDetails
   * @param invitationId
   */
  async acceptInvitationUpdateDbProcess(projectDetails: Project, session: ClientSession,
                                        organizationDetails: Organization, userDetails: User, invitationId: string) {

    // check if user is added as collaborator in project and we are here only to update his basic details
    const userIndexInProjectCollaboratorIndex = projectDetails.members.findIndex(member => member.emailId === userDetails.emailId);

    // update project mark collaborator as invite accepted true
    await this._projectService.updateById(projectDetails._id.toString(), {
      $set: { [`members.${userIndexInProjectCollaboratorIndex}.isInviteAccepted`]: true }
    }, session);

    // update organization, add user as organization member
    const isAlreadyOrganizationMember = userDetails.organizations && userDetails.organizations.some((organization => {
      return organizationDetails._id.toString() === organization.toString();
    }));

    if (!isAlreadyOrganizationMember) {
      await this._organizationService.updateById(organizationDetails._id.toString(), {
        $push: { members: userDetails._id }, $inc: { activeMembersCount: 1, billableMemberCount: 1 }
      }, session);
    }

    // update current invitation and set invite accepted true
    await this.acceptInvitationById(invitationId, session);
  }

  /**
   * accept invitation by invitation id
   * @param invitationId
   * @param session
   */
  private async acceptInvitationById(invitationId: string, session?: ClientSession) {
    return await this.updateById(invitationId, {
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
      isInviteAccepted: false
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
      $match: { '_id': this.toObjectId(invitationId), isExpired: false }
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

  /**
   * check invitation link is valid or
   * check if invitation is expired or not
   * check if user emailId and invitee user id in invitation are same
   * @param invitationDetails
   * @param userEmailId
   */
  invitationLinkBasicValidation(invitationDetails, userEmailId: string) {
    if (!invitationDetails) {
      throw new BadRequestException('Invalid invitation link');
    } else {
      // invitation is expired
      if (isInvitationExpired(invitationDetails.invitedAt)) {
        throw new BadRequestException('Invitation link has been expired! please request a new one');
      }

      // invitation email and user email are same or not
      if (invitationDetails.invitationToEmailId !== userEmailId) {
        throw new BadRequestException('Invalid invitation link! this invitation link is not for this email id');
      }
    }
  }
}
