import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const taskSchema = new Schema({
  name: { type: String, required: [true, 'Please Add task name'] },
  displayName: { type: String },
  description: { type: String },
  project: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please Select Project First!']
  },
  assignee: { type: Schema.Types.ObjectId, ref: DbCollection.users },
  attachments: [],
  taskType: { type: String },
  comments: [],
  estimatedTime: { type: Number },
  remainingTime: { type: Number },
  totalLoggedTime: { type: Number },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  priority: { type: String },
  tags: [],
  url: { type: String },
  progress: { type: Number },
  status: { type: String },
  sprint: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
});

// options
taskSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// plugins
taskSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);
