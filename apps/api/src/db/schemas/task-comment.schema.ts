import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskCommentSchema = new Schema({
  comment: { type: String },
  attachments: [{ type: Schema.Types.ObjectId, ref: DbCollection.attachments }],
  isPinned: { type: Boolean, default: false },
  pinnedById: { type: Schema.Types.ObjectId, ref: DbCollection.users },
  pinnedAt: { type: Date },
  taskId: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
  ...commonSchemaFields
}, schemaOptions);

// options
taskCommentSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// virtual
taskCommentSchema
  .virtual('attachmentsDetails', {
    ref: DbCollection.attachments,
    localField: 'attachments',
    foreignField: '_id'
  });

taskCommentSchema
  .virtual('pinnedBy', {
    ref: DbCollection.users,
    localField: 'pinnedById',
    foreignField: '_id',
    justOne: true
  });

taskCommentSchema
  .virtual('task', {
    ref: DbCollection.tasks,
    localField: 'taskId',
    foreignField: '_id',
    justOne: true
  });

taskCommentSchema
  .virtual('createdBy', {
    ref: DbCollection.users,
    localField: 'createdById',
    foreignField: '_id'
  });

taskCommentSchema
  .virtual('updatedBy', {
    ref: DbCollection.users,
    localField: 'updatedById',
    foreignField: '_id'
  });


// plugins
taskCommentSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
