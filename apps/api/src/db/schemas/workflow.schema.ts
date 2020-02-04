import { Schema, Types } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

const workflowStatusesSchema = new Schema({
  status: { type: Types.ObjectId },
  defaultAssigneeId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.users,
    default: null
  },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
});

export const workflowSchema = new Schema({
  name: { type: String, required: [true, 'Workflow Name is required'] },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please Select Project First!']
  },
  statuses: [workflowStatusesSchema],
  isActive: { type: Boolean, default: false },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);


// options
workflowSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', {
    virtuals: true, transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  });

// virtual
workflowSchema.virtual('project', {
  ref: DbCollection.projects,
  localField: 'projectId',
  foreignField: '_id'
});

workflowSchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id'
});

workflowSchema.virtual('updatedBy', {
  ref: DbCollection.users,
  localField: 'updatedById',
  foreignField: '_id'
});

// plugins
workflowSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
