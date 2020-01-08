import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseService } from './base.service';
import { DbCollection, Organization } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { UsersService } from './users.service';
import { ModuleRef } from '@nestjs/core';
import { GeneralService } from './general.service';

@Injectable()
export class OrganizationService extends BaseService<Organization & Document> implements OnModuleInit {
  private _userService: UsersService;

  constructor(
    @InjectModel(DbCollection.organizations) private readonly _organizationModel: Model<Organization & Document>,
    private _moduleRef: ModuleRef, private _generalService: GeneralService
  ) {
    super(_organizationModel);
  }

  onModuleInit(): any {
    this._userService = this._moduleRef.get('UsersService');
  }

  /**
   * create organization
   * add it created organization to user organization array
   * @param organization
   */
  async createOrganization(organization: Organization) {
    const session = await this.startSession();

    const organizationModel = new Organization();
    organizationModel.name = organization.name;
    organizationModel.description = organization.description;
    organizationModel.billableMemberCount = 1;
    organizationModel.activeMembersCount = 1;
    organizationModel.createdBy = this._generalService.userId;
    organizationModel.members.push(this._generalService.userId);

    try {
      const result = await this.create([organizationModel], session);

      // update user
      const userDetails = await this._userService.findById(organization.createdBy as string);

      // set organization as current organization for user
      // if (!userDetails.organizations.length) {
      userDetails.currentOrganizationId = result[0].id;
      // }

      // add organization to user organization array
      userDetails.organizations.push(result[0].id);
      await this._userService.updateUser(userDetails.id, userDetails, session);

      await this.commitTransaction(session);
      return result[0];
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  async deleteOrganization(id: string) {
    const session = await this._organizationModel.db.startSession();
    session.startTransaction();

    try {
      await this.delete(id);
      await session.commitTransaction();
      session.endSession();
      return 'Organization Deleted Successfully!';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async updateOrganization(id: string, organization: Partial<Organization>) {
    const session = await this._organizationModel.db.startSession();
    session.startTransaction();

    try {
      const result = await this.update(id, organization, session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }
}
