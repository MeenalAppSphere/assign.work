import { Schema } from 'mongoose';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';
import { DbCollection, SprintStatus } from '@aavantan-app/models';
import { DEFAULT_WORKING_CAPACITY, DEFAULT_WORKING_CAPACITY_PER_DAY } from '../../shared/helpers/defaultValueConstant';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const sprintSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Sprint Name is required']
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
  columns: {
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
      addedById: { type: Schema.Types.ObjectId, ref: DbCollection.users },
      updatedAt: { type: Date },
      movedAt: { type: Date },
      movedById: { type: Schema.Types.ObjectId, ref: DbCollection.users }
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
  totalOverLoggedTime: { type: Number, default: 0 },
  boardId: { type: Schema.Types.ObjectId, ref: DbCollection.board },
  ...commonSchemaFields
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

sprintSchema.virtual('columns.tasks.task', {
  ref: DbCollection.tasks,
  localField: 'columns.tasks.taskId',
  foreignField: '_id'
});

sprintSchema.virtual('columns.tasks.task.taskType', {
  ref: DbCollection.taskType,
  localField: 'columns.tasks.taskId.taskTypeId',
  foreignField: '_id'
});

sprintSchema.virtual('columns.tasks.task.status', {
  ref: DbCollection.taskStatus,
  localField: 'columns.tasks.taskId.statusId',
  foreignField: '_id',
  justOne: true
});

sprintSchema.virtual('columns.tasks.task.priority', {
  ref: DbCollection.taskPriority,
  localField: 'columns.tasks.taskId.priorityId',
  foreignField: '_id',
  justOne: true
});

sprintSchema.virtual('columns.tasks.addedBy', {
  ref: DbCollection.users,
  localField: 'columns.tasks.addedById',
  foreignField: '_id',
  justOne: true
});

sprintSchema.virtual('membersCapacity.user', {
  ref: DbCollection.users,
  localField: 'membersCapacity.userId',
  foreignField: '_id',
  justOne: true
});

// plugins
sprintSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
