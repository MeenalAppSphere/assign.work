import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BaseService } from '../base.service';
import { DbCollection, Organization, User } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Document, Model } from 'mongoose';
import { UsersService } from '../users.service';
import { ModuleRef } from '@nestjs/core';
import { GeneralService } from '../general.service';
import { ProjectService } from '../project/project.service';
import { BadRequest, validOrganizationOrProjectName } from '../../helpers/helpers';
import { OrganizationUtilityService } from './organization.utility.service';

@Injectable()
export class OrganizationService extends BaseService<Organization & Document> implements OnModuleInit {
  private _userService: UsersService;
  private _projectService: ProjectService;

  private _utilityService: OrganizationUtilityService;

  constructor(
    @InjectModel(DbCollection.organizations) private readonly _organizationModel: Model<Organization & Document>,
    private _moduleRef: ModuleRef,
    private _generalService: GeneralService
  ) {
    super(_organizationModel);
  }

  onModuleInit(): void {
    this._userService = this._moduleRef.get('UsersService');
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new OrganizationUtilityService();
  }

  /**
   * create organization
   * add it created organization to user organization array
   * @param organization
   */
  async createOrganization(organization: Organization) {
    this._utilityService.createOrganizationValidation(organization);

    // duplicate organization name
    if (await this.isDuplicate(organization)) {
      BadRequest('Duplicate organization name not allowed');
    }

    return await this.withRetrySession(async (session: ClientSession) => {

      const organizationModel = new Organization();
      organizationModel.name = organization.name;
      organizationModel.description = organization.description;
      organizationModel.billableMemberCount = 1;
      organizationModel.activeMembersCount = 1;
      organizationModel.createdBy = this._generalService.userId;

      // add organization owner as organization member
      organizationModel.members = [this._generalService.userId];

      const result = await this.create([organizationModel], session);

      // update user
      await this._userService.findById(organization.createdBy as string);

      // set organization as current organization for user
      // add organization to user organizations array
      await this._userService.updateUser(organization.createdBy as string, {
        $set: {
          currentOrganizationId: result[0].id
        }, $push: { organizations: result[0].id }
      }, session);
      return result[0];
    });
  }

  async updateOrganization(id: string, organization: Partial<Organization>) {
    const session = await this._organizationModel.db.startSession();
    session.startTransaction();

    try {
      const result = await this.updateById(id, organization, session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * switch organization
   * first check organization is valid or not and user is collaborator of given organization
   * find all projects and status latest updated project as current project
   * @param organizationId
   */
  async switchOrganization(organizationId: string) {
    if (!this.isValidObjectId(organizationId)) {
      throw new NotFoundException('Organization not found');
    }

    const session = await this.startSession();

    try {
      // get organization details
      const organizationDetails: Organization = await this._organizationModel.findById(organizationId).select('members createdBy updatedBy').lean().exec();
      const userDetails: User = await this._userService.findById(this._generalService.userId);

      if (userDetails.currentOrganizationId.toString() === organizationId) {
        throw new BadRequestException('you can\'t switch to same organization');
      }

      if (!organizationDetails) {
        throw new NotFoundException('Organization not Found');
      } else {
        // check if user is collaborator of organization
        const isCollaborator = organizationDetails.members.some(s => s.toString() === this._generalService.userId) || (organizationDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

        if (!isCollaborator) {
          throw new BadRequestException('You are not a part of this Organization');
        }
      }

      // get project of given organization sort by update at in descending order
      const projectsOfThisOrganization = await this._projectService.find({
        filter: {
          organizationId: organizationId,
          members: {
            $elemMatch: { userId: this._generalService.userId }
          }
        }, select: 'name description', sort: 'updatedAt', sortBy: 'desc'
      });

      // update user doc
      const userUpdateDoc = {
        currentOrganizationId: organizationId, currentProject: null
      };

      // check if organization have project then add last updated project as user's current project
      if (projectsOfThisOrganization && projectsOfThisOrganization.length) {
        userUpdateDoc.currentProject = projectsOfThisOrganization[0]._id;
      }

      // update user and switch organization and project
      await this._userService.updateById(this._generalService.userId, { $set: userUpdateDoc }, session);
      await this.commitTransaction(session);
      return await this._userService.getUserProfile(this._generalService.userId);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * is duplicate organization name
   * @param model
   * @param exceptThis
   */
  private async isDuplicate(model: Organization, exceptThis?: string): Promise<boolean> {
    const queryFilter = {
      name: { $regex: `^${model.name.trim()}$`, $options: 'i' }
    };

    if (exceptThis) {
      queryFilter['_id'] = { $ne: exceptThis };
    }

    const queryResult = await this.find({
      filter: queryFilter
    });

    return !!(queryResult && queryResult.length);
  }

  /**
   * get organization details by id
   * @param id: organization id
   */
  public async getOrganizationDetails(id: string) {
    if (!this.isValidObjectId(id)) {
      throw new NotFoundException('Organization not found');
    }
    const organizationDetails: Organization = await this.findOne({
      filter: { _id: id }, select: 'members createdBy updatedBy', lean: true
    });

    if (!organizationDetails) {
      throw new NotFoundException('Organization not Found');
    } else {
      const isMember = organizationDetails.members.some(s => s.toString() === this._generalService.userId) || (organizationDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

      if (!isMember) {
        throw new BadRequestException('You are not a part of this Organization');
      }
    }
    return organizationDetails;
  }
}
