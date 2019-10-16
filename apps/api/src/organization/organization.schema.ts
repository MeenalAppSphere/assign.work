import { Schema } from 'mongoose';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const organizationSchema = new Schema({
  name: { type: String, required: [true, 'Organization Name Is Required'] },
  description: { type: String },
  displayName: { type: String },
  logoUrl: { type: String },
  billableMemberCount: { type: Number },
  activeMembersCount: { type: Number },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.users,
    required: [true, 'Organization Creator Name is required']
  },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false },
  members: [{
    type: Schema.Types.ObjectId,
    ref: DbCollection.users
  }]
}, schemaOptions);

// plugins
organizationSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);
