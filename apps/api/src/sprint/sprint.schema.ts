import { Schema } from 'mongoose';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import { DbCollection, SprintStatus } from '@aavantan-app/models';
import { DEFAULT_WORKING_CAPACITY, DEFAULT_WORKING_CAPACITY_PER_DAY } from '../shared/helpers/defaultValueConstant';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const uniqueValidator = require('mongoose-unique-validator');

export const sprintSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Sprint Name is required'],
    index: { unique: true, partialFilterExpression: { isDeleted: false } },
    uniqueCaseInsensitive: true
  },
  startedAt: { type: Date, required: [true, 'Sprint start time is required'] },
  endAt: { type: Date, required: [true, 'Sprint end time is required'] },
  goal: { type: String, required: [true, 'Sprint goal is required'] },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please Select Project First!']
  },
  autoUpdate: {
    isAllowed: { type: Boolean, default: false },
    autoUpdateAt: { type: Date }
  },
  sprintStatus: {
    status: {
      type: String,
      enum: Object.values(SprintStatus)
    },
    updatedAt: { type: Date },
    id: { type: String }
  },
  stages: {
    type: Array,
    default: [],
    status: [],
    totalEstimation: { type: Number, default: 0 },
    tasks: {
      type: Array,
      default: [],
      taskId: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
      description: { type: String },
      sequenceNumber: { type: Number },
      addedAt: { type: Date },
      updatedAt: { type: Date },
      addedById: { type: Schema.Types.ObjectId, ref: DbCollection.users }
    }
  },
  membersCapacity: {
    type: Array,
    userId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
    workingCapacity: { type: Number, default: DEFAULT_WORKING_CAPACITY },
    workingCapacityPerDay: { type: Number, default: DEFAULT_WORKING_CAPACITY_PER_DAY }
  },
  totalCapacity: { type: Number, default: 0 },
  totalEstimation: { type: Number, default: 0 },
  totalLoggedTime: { type: Number, default: 0 },
  createdById: { type: Schema.Types.ObjectId, required: [true, 'Created by is required'], ref: DbCollection.users },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);

// options
sprintSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', {
    virtuals: true, transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  });

// virtual
sprintSchema.virtual('project', {
  ref: DbCollection.projects,
  localField: 'projectId',
  foreignField: '_id'
});

sprintSchema.virtual('createdBy', {
  ref: DbCollection.users,
  localField: 'createdById',
  foreignField: '_id'
});

sprintSchema.virtual('updatedBy', {
  ref: DbCollection.users,
  localField: 'updatedById',
  foreignField: '_id'
});

sprintSchema.virtual('stages.tasks.task', {
  ref: DbCollection.tasks,
  localField: 'stages.tasks.taskId',
  foreignField: '_id'
});

sprintSchema.virtual('stages.tasks.addedBy', {
  ref: DbCollection.users,
  localField: 'stages.tasks.addedById',
  foreignField: '_id'
});

sprintSchema.virtual('membersCapacity.user', {
  ref: DbCollection.users,
  localField: 'membersCapacity.userId',
  foreignField: '_id'
});

// plugins
sprintSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(uniqueValidator, { message: '{PATH} already exists' })
;
