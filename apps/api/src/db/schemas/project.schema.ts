import { Schema, Types } from 'mongoose';
import { DbCollection, ProjectTemplateEnum } from '@aavantan-app/models';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';
import {
  DEFAULT_PROJECT_TEMPLATE_TYPE,
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY,
  DEFAULT_WORKING_DAYS
} from '../../shared/helpers/defaultValueConstant';

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
    },
    isRemoved: { type: Boolean, default: false }
  },
  organizationId: {
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
    statuses: [{ type: Types.ObjectId }],
    tags: [projectTagsSchema],
    defaultTaskTypeId: { type: Schema.Types.ObjectId, ref: DbCollection.taskType },
    defaultTaskStatusId: { type: Schema.Types.ObjectId, ref: DbCollection.taskStatus },
    defaultTaskPriorityId: { type: Schema.Types.ObjectId, ref: DbCollection.taskPriority },
    required: false
  },
  activeBoardId: { type: Types.ObjectId, ref: DbCollection.board },
  sprintId: { type: Schema.Types.ObjectId, ref: DbCollection.sprint },
  ...commonSchemaFields
}, schemaOptions);

// options
projectSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

// plugins
projectSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);

// virtual
projectSchema
  .virtual('organization', {
    ref: DbCollection.organizations,
    localField: 'organizationId',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('members.userDetails', {
    ref: DbCollection.users,
    localField: 'members.userId',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('settings.defaultTaskType', {
    ref: DbCollection.taskType,
    localField: 'settings.defaultTaskTypeId',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('settings.defaultTaskStatus', {
    ref: DbCollection.taskStatus,
    localField: 'settings.defaultTaskStatusId',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('settings.defaultTaskPriority', {
    ref: DbCollection.taskPriority,
    localField: 'settings.defaultTaskPriorityId',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('createdBy', {
    ref: DbCollection.users,
    localField: 'createdById',
    foreignField: '_id',
    justOne: true
  });

projectSchema
  .virtual('activeBoard', {
    ref: DbCollection.board,
    localField: 'activeBoardId',
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
