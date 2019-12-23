import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskHistorySchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
  sprintId: { type: Schema.Types.ObjectId, ref: DbCollection.sprint },
  action: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  desc: {},
  isDeleted: { type: Schema.Types.Boolean, default: false }
}, schemaOptions);


// options
taskHistorySchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// virtual
taskHistorySchema.virtual('task', {
  ref: DbCollection.tasks,
  localField: 'taskId',
  foreignField: '_id',
  justOne: true
});

taskHistorySchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id',
  justOne: true
});

// plugins
taskHistorySchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
