import { Schema } from 'mongoose';
import { DbCollections } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

const commentSchema = new Schema({
  comment: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollections.users, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  attachments: [{ type: Schema.Types.ObjectId, ref: DbCollections.attachments }],
  isPinned: { type: Boolean, default: false }
});

commentSchema.virtual('attachmentsDetails', {
  ref: DbCollections.attachments,
  localField: 'attachments',
  foreignField: '_id'
});

commentSchema.virtual('createdBy', {
  ref: DbCollections.users,
  localField: 'createdById',
  foreignField: '_id'
});

export const taskSchema = new Schema({
  name: { type: String, required: [true, 'Please Add task title'] },
  displayName: { type: String },
  description: { type: String },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollections.projects,
    required: [true, 'Please Select Project First!']
  },
  assigneeId: { type: Schema.Types.ObjectId, ref: DbCollections.users },
  watchers: [{ type: Schema.Types.ObjectId, ref: DbCollections.users, required: false }],
  attachments: [{ type: Schema.Types.ObjectId, ref: DbCollections.attachments }],
  taskTypeId: { type: Schema.Types.ObjectId,  ref: DbCollections.taskType, required: [true, 'Please add task type'] },
  taskType: { type: String, required: [true, 'Please add task type'] },
  comments: [commentSchema],
  estimatedTime: { type: Number, default: 0 },
  remainingTime: { type: Number, default: 0 },
  overLoggedTime: { type: Number, default: 0 },
  totalLoggedTime: { type: Number, default: 0 },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  priority: { type: String },
  tags: [],
  url: { type: String },
  progress: { type: Number, default: 0 },
  overProgress: { type: Number, default: 0 },
  status: { type: String },
  sprintId: { type: Schema.Types.ObjectId, ref: DbCollections.sprint },
  dependentItemId: { type: Schema.Types.ObjectId, ref: DbCollections.tasks, required: false },
  relatedItemId: [{ type: Schema.Types.ObjectId, ref: DbCollections.tasks, required: false }],
  createdById: { type: Schema.Types.ObjectId, ref: DbCollections.users, required: true },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollections.users, required: false },
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
  ref: DbCollections.projects,
  localField: 'projectId',
  foreignField: '_id'
});

taskSchema.virtual('assignee', {
  ref: DbCollections.users,
  localField: 'assigneeId',
  foreignField: '_id'
});

taskSchema.virtual('watchersDetails', {
  ref: DbCollections.tasks,
  localField: 'watchers',
  foreignField: '_id'
});

taskSchema.virtual('createdBy', {
  ref: DbCollections.users,
  localField: 'createdById',
  foreignField: '_id'
});

taskSchema.virtual('updatedBy', {
  ref: DbCollections.users,
  localField: 'updatedById',
  foreignField: '_id'
});

taskSchema.virtual('dependentItem', {
  ref: DbCollections.tasks,
  localField: 'dependentItemId',
  foreignField: '_id'
});

taskSchema.virtual('relatedItem', {
  ref: DbCollections.tasks,
  localField: 'relatedItemId',
  foreignField: '_id'
});

taskSchema.virtual('attachmentsDetails', {
  ref: DbCollections.attachments,
  localField: 'attachments',
  foreignField: '_id'
});

taskSchema.virtual('sprint', {
  ref: DbCollections.sprint,
  localField: 'sprintId',
  foreignField: '_id'
});

// taskSchema.virtual('taskType', {
//   ref: DbCollections.taskType,
//   localField: 'taskTypeId',
//   foreignField: '_id'
// });

// plugins
taskSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
