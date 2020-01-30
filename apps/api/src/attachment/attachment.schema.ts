import { Schema } from 'mongoose';
import { DbCollections } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const attachmentSchema = new Schema({
  name: { type: String },
  mimeType: { type: String },
  url: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollections.users, required: true },
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

// virtual
attachmentSchema.virtual('createdBy', {
  ref: DbCollections.users,
  localField: 'createdById',
  foreignField: '_id'
});
