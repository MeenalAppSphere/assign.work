import { Schema, Types } from 'mongoose';
import { basicSchemaFields, mongooseErrorTransformPluginOptions } from './base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');


export const boardSchema = new Schema({
  name: { type: String, required: [true, 'Board Name is required'] },
  projectId: { type: Types.ObjectId, ref: DbCollection.projects, required: [true, 'Project name is required'] },
  columns: {
    type: Array,
    headerStatusId: { type: Types.ObjectId, ref: DbCollection.taskStatus },
    includedStatusesId: [{ type: Types.ObjectId, ref: DbCollection.taskStatus }],
    isActive: { type: Boolean, default: true },
    columnOrderNo: { type: Number },
    columnColor: { type: String },
    defaultAssigneeId: { type: Types.ObjectId, ref: DbCollection.users }
  },
  ...basicSchemaFields
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
  .virtual('columns.includedStatuses', {
    ref: DbCollection.taskStatus,
    localField: 'columns.includedStatusesId',
    foreignField: '_id'
  });

boardSchema
  .virtual('columns.defaultAssignee', {
    ref: DbCollection.users,
    localField: 'columns.defaultAssigneeId',
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
