import { Schema, Types } from 'mongoose';
import { commonSchemaFields, mongooseErrorTransformPluginOptions } from './base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');


export const boardSchema = new Schema({
  name: { type: String, required: [true, 'Board Name is required'] },
  projectId: { type: Types.ObjectId, ref: DbCollection.projects, required: [true, 'Project name is required'] },
  columns: {
    type: Array,
    headerStatusId: { type: Types.ObjectId, ref: DbCollection.taskStatus },
    includedStatuses: {
      type: Array,
      statusId: { type: Types.ObjectId, ref: DbCollection.taskStatus },
      defaultAssigneeId: { type: Types.ObjectId, ref: DbCollection.users },
      isShown: { type: Boolean, default: true }
    },
    columnOrderNo: { type: Number },
    columnColor: { type: String }
  },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  publishedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  ...commonSchemaFields
});


// options
boardSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });


// virtual
boardSchema
  .virtual('columns.headerStatus', {
    ref: DbCollection.taskStatus,
    localField: 'columns.headerStatusId',
    foreignField: '_id',
    justOne: true
  });

boardSchema
  .virtual('columns.includedStatuses.status', {
    ref: DbCollection.taskStatus,
    localField: 'columns.includedStatuses.statusId',
    foreignField: '_id',
    justOne: true
  });

boardSchema
  .virtual('columns.includedStatuses.defaultAssignee', {
    ref: DbCollection.users,
    localField: 'columns.includedStatuses.defaultAssigneeId',
    foreignField: '_id',
    justOne: true
  });

boardSchema
  .virtual('project', {
    ref: DbCollection.projects,
    localField: 'projectId',
    foreignField: '_id'
  });

// plugins
boardSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
