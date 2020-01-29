import { Schema, Types } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const workFlowSchema = new Schema({
  name: { type: String, required: [true, 'Workflow Name is required'] },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please Select Project First!']
  },
  stageId: { type: Types.ObjectId, required: [true, 'Stage Name is required'] },
  previousStageId: { type: Types.ObjectId, default: null },
  defaultStatusId: { type: Types.ObjectId, required: [true, 'Default Status name is required'] },
  defaultAssigneeId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.users,
    default: null
  },
  allowedStatuses: { type: Array },
  allowedStages: {type: Array},
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);


// options
workFlowSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', {
    virtuals: true, transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  });

// virtual
workFlowSchema.virtual('project', {
  ref: DbCollection.projects,
  localField: 'projectId',
  foreignField: '_id'
});

workFlowSchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id'
});

workFlowSchema.virtual('updatedBy', {
  ref: DbCollection.users,
  localField: 'updatedById',
  foreignField: '_id'
});

// plugins
workFlowSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
