import { Injectable } from '@nestjs/common';
import { BaseService } from '../shared/services/base.service';
import { DbCollection, Organization } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types } from 'mongoose';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrganizationService extends BaseService<Organization & Document> {
  constructor(
    @InjectModel(DbCollection.organizations) private readonly _organizationModel: Model<Organization & Document>,
    private readonly _userService: UsersService
  ) {
    super(_organizationModel);
  }

  async createOrganization(organization: Organization) {
    const session = await this._organizationModel.db.startSession();
    session.startTransaction();
    try {
      const result = await this.create([new this._organizationModel(organization)], session);

      // update user
      const userDetails = await this._userService.findById(organization.createdBy as string);
      userDetails.organizations.push(result[0].id);
      await this._userService.updateUser(userDetails.id, userDetails, session);

      await session.commitTransaction();
      session.endSession();
      return result[0];
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async getAllUsers(id: string) {
    return this.find({
      members: Types.ObjectId(id)
    });
  }
}