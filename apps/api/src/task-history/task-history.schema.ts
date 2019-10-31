import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const taskHistorySchema = new Schema({
  task: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
  action: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  desc: {}
});


// options
taskHistorySchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// plugins
taskHistorySchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);
