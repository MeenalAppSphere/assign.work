import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, User } from '@aavantan-app/models';
import { Model, Document } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>) {
  }

  async findOne(emailId: string) {
    return this._userModel.findOne({ emailId }).exec();
  }
}
