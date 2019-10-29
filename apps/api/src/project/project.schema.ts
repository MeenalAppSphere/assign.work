import { Schema } from 'mongoose';
import { DbCollection, ProjectTemplateEnum } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const projectSchema = new Schema({
  name: { type: String, required: [true, 'Project Name is required'] },
  description: { type: String },
  members: {
    type: Array,
    default: [],
    userId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
    emailId: { type: String },
    isEmailSent: { type: Boolean },
    isInviteAccepted: { type: Boolean }
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.organizations,
    required: [true, 'Please select Organization.']
  },
  template: {
    type: String,
    required: [false, 'Please Select Project Template'],
    enum: Object.values(ProjectTemplateEnum)
  },
  settings: {
    stages: [],
    taskTypes: [],
    required: false,
    default: {}
  },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
});

// options
projectSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// plugins
projectSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);

// virtual
projectSchema
  .virtual('members.userDetails', {
    ref: DbCollection.users,
    localField: 'members.userId',
    foreignField: '_id'
  });
