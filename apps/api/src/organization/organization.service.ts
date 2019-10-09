import { Injectable } from '@nestjs/common';
import { BaseService } from '../shared/services/base.service';
import { DbCollection, Organization } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';

@Injectable()
export class OrganizationService extends BaseService<Organization & Document> {
  constructor(
    @InjectModel(DbCollection.organizations) private readonly _organizationModel: Model<Organization & Document>
  ) {
    super(_organizationModel);
  }

  async createOrganization(organization: Organization) {
    const session = await this._organizationModel.db.startSession();
    session.startTransaction();
    try {
      const result = await this.create([new this._organizationModel(organization)], session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      return e;
    }
  }
}
