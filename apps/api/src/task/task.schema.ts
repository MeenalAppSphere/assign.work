import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');


const commentSchema = new Schema({
  comment: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  attachments: { type: Schema.Types.ObjectId, ref: DbCollection.attachments },
  isPinned: { type: Boolean, default: false }
});

commentSchema.virtual('attachmentsDetails', {
  ref: DbCollection.attachments,
  localField: 'attachments',
  foreignField: '_id'
});

commentSchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id'
});

export const taskSchema = new Schema({
  name: { type: String, required: [true, 'Please Add task title'] },
  displayName: { type: String },
  description: { type: String },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please Select Project First!']
  },
  assigneeId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
  attachments: [],
  taskType: { type: String, required: [true, 'Please add task type'] },
  comments: [commentSchema],
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
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);

// options
taskSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', {
    virtuals: true, transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  });

// virtual
taskSchema.virtual('project', {
  ref: DbCollection.projects,
  localField: 'projectId',
  foreignField: '_id'
});

taskSchema.virtual('assignee', {
  ref: DbCollection.users,
  localField: 'assigneeId',
  foreignField: '_id'
});

taskSchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id'
});

taskSchema.virtual('updatedBy', {
  ref: DbCollection.users,
  localField: 'updatedById',
  foreignField: '_id'
});

// plugins
taskSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);
