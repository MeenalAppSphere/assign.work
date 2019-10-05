import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRequestModel, DbCollection, MongoosePaginateQuery, User } from '@aavantan-app/models';
import { Model, Document, Query, ClientSession } from 'mongoose';
import { BaseService } from '../shared/services/base.service';

@Injectable()
export class UsersService extends BaseService<User & Document> {
  constructor(@InjectModel(DbCollection.users) protected readonly _userModel: Model<User & Document>) {
    super(_userModel);
  }

  async getAll() {
    const query = new Query();
    const paginationRequest = new MongoosePaginateQuery();
    paginationRequest.populate = 'projects';
    return await this.getAllPaginatedData(query, paginationRequest);
  }

  async createUser(user: Partial<User> | Array<Partial<User>>, session?: ClientSession) {
    session = session || await this._userModel.db.startSession();
    session.startTransaction();

    try {
      const result = await this.create(new this._userModel(user), session);
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
