import { Schema } from 'mongoose';
import { DbCollection, ProjectTemplateEnum } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import {
  DEFAULT_PROJECT_TEMPLATE_TYPE,
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY
} from '../shared/helpers/defaultValueConstant';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

const projectTagsSchema = new Schema({
  name: String,
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);

export const projectSchema = new Schema({
  name: { type: String, required: [true, 'Project Name is required'] },
  description: { type: String },
  members: {
    type: Array,
    default: [],
    userId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
    emailId: { type: String },
    isEmailSent: { type: Boolean },
    isInviteAccepted: { type: Boolean },
    workingCapacity: { type: Number, default: DEFAULT_WORKING_CAPACITY },
    workingCapacityPerDay: { type: Number, default: DEFAULT_WORKING_CAPACITY_PER_DAY }
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.organizations,
    required: [true, 'Please select Organization.']
  },
  template: {
    type: String,
    required: false,
    enum: Object.values(ProjectTemplateEnum),
    default: DEFAULT_PROJECT_TEMPLATE_TYPE
  },
  settings: {
    stages: [],
    taskTypes: [],
    priorities: [],
    status: [],
    tags: [projectTagsSchema],
    required: false
  },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);

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
    foreignField: '_id',
    justOne: true
  });
