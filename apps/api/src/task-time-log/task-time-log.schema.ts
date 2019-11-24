import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import { taskHistorySchema } from '../task-history/task-history.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskTimeLogSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, required: [true, 'Please Select Task'], ref: DbCollection.tasks },
  desc: { type: String, required: [true, 'Please add description'] },
  loggedTime: { type: Number, default: 0 },
  remainingTime: { type: Number, default: 0 },
  startedAt: { type: Date, required: [true, 'Please add Started At'] },
  endAt: { type: Date, required: [true, 'Please Add End At'] },
  isDeleted: { type: Boolean, default: false },
  createdById: { type: Schema.Types.ObjectId, required: [true, 'Created by is required'], ref: DbCollection.users },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users }
}, schemaOptions);


// options
taskTimeLogSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// virtual
taskTimeLogSchema.virtual('task', {
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

taskHistorySchema.virtual('updatedBy', {
  ref: DbCollection.users,
  localField: 'updatedById',
  foreignField: '_id',
  justOne: true
});

// plugins
taskHistorySchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
