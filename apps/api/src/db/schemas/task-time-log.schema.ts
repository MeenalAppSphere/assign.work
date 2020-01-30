import { Schema } from 'mongoose';
import { DbCollections } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskTimeLogSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, required: [true, 'Please Select Task'], ref: DbCollections.tasks },
  sprintId: { type: Schema.Types.ObjectId, ref: DbCollections.sprint },
  desc: { type: String, required: [true, 'Please add description'] },
  loggedTime: { type: Number, default: 0 },
  remainingTime: { type: Number, default: 0 },
  isPeriod: { type: Boolean, default: false },
  startedAt: { type: Date, required: [true, 'Please add Started At'] },
  endAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  createdById: { type: Schema.Types.ObjectId, required: [true, 'Created by is required'], ref: DbCollections.users },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollections.users }
}, schemaOptions);


// options
taskTimeLogSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// virtual
taskTimeLogSchema.virtual('task', {
  ref: DbCollections.tasks,
  localField: 'taskId',
  foreignField: '_id',
  justOne: true
});

taskTimeLogSchema.virtual('createdBy', {
  ref: DbCollections.users,
  localField: 'createdById',
  foreignField: '_id',
  justOne: true
});

taskTimeLogSchema.virtual('updatedBy', {
  ref: DbCollections.users,
  localField: 'updatedById',
  foreignField: '_id',
  justOne: true
});

// plugins
taskTimeLogSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
