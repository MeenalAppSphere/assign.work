import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const attachmentSchema = new Schema({
  name: { type: String },
  mimeType: { type: String },
  url: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);


// options
attachmentSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// plugins
attachmentSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);