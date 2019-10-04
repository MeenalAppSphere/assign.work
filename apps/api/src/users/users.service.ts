import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRequestModel, DbCollection, MongoosePaginateQuery, User } from '@aavantan-app/models';
import { Model, Document, Query } from 'mongoose';
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
}
