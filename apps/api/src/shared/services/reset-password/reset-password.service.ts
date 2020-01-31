import { Injectable } from '@nestjs/common';
import { BaseService } from '../base.service';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, ResetPasswordModel } from '@aavantan-app/models';

@Injectable()
export class ResetPasswordService extends BaseService<ResetPasswordModel & Document> {

  constructor(
    @InjectModel(DbCollection.resetPassword) protected readonly _resetPasswordModel: Model<ResetPasswordModel & Document>,
  ) {
    super(_resetPasswordModel);
  }

}
