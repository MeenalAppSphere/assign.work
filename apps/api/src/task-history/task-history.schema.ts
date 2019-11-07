import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const taskHistorySchema = new Schema({
  task: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
  action: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  desc: {}
}, schemaOptions);


// options
taskHistorySchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });


taskHistorySchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id'
});

// plugins
taskHistorySchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);
