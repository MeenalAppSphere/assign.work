import { Schema } from 'mongoose';
import { DbCollection, ProjectTemplateEnum } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import {
  DEFAULT_PROJECT_TEMPLATE_TYPE,
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY,
  DEFAULT_WORKING_DAYS
} from '../shared/helpers/defaultValueConstant';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

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
    workingCapacityPerDay: { type: Number, default: DEFAULT_WORKING_CAPACITY_PER_DAY },
    workingDays: {
      type: Array, default: DEFAULT_WORKING_DAYS
    }
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
    taskTypes: [{ type: Schema.Types.ObjectId, ref: DbCollection.taskType }],
    priorities: [],
    status: [],
    tags: [projectTagsSchema],
    required: false
  },
  sprintId: { type: Schema.Types.ObjectId, ref: DbCollection.sprint },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);

// options
projectSchema
  .set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
    }
  })
  .set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
    }
  });

// plugins
projectSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);

// virtual
projectSchema
  .virtual('members.userDetails', {
    ref: DbCollection.users,
    localField: 'members.userId',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('sprint', {
    ref: DbCollection.sprint,
    localField: 'sprintId',
    foreignField: '_id',
    justOne: true
  });
