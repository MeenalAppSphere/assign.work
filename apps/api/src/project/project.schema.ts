import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const projectSchema = new Schema({
  name: { type: String, required: [true, 'Project Name is required'] },
  access: { type: String },
  version: { type: String, default: 'v_1.0' },
  members: {
    type: Array,
    default: [],
    userId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
    emailId: { type: String },
    isEmailSent: { type: Boolean },
    isInviteAccepted: { type: Boolean }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true }
}, schemaOptions);

// plugins
projectSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);
