import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

const taskCommentSchema = new Schema({
  comment: { type: String },
  attachments: [{ type: Schema.Types.ObjectId, ref: DbCollection.attachments }],
  isPinned: { type: Boolean, default: false },
  taskId: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
  ...commonSchemaFields
}, schemaOptions);

// options
taskCommentSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// virtual
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
