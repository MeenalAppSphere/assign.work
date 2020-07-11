import { Schema } from 'mongoose';
import { commonSchemaFields, mongooseErrorTransformPluginOptions } from './base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const sprintReportSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please Select Project First!']
  },
  sprintId: { type: Schema.Types.ObjectId, ref: DbCollection.sprint },
  finalStatusIds: [{ type: Schema.Types.ObjectId, ref: DbCollection.taskStatus }],
  reportTasks: {
    type: Array,
    taskId: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
    name: { type: String, required: [true, 'Please Add task title'] },
    displayName: { type: String },
    description: { type: String, default: '' },
    assigneeId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
    taskTypeId: { type: Schema.Types.ObjectId, ref: DbCollection.taskType },
    priorityId: { type: Schema.Types.ObjectId, ref: DbCollection.taskPriority },
    statusId: { type: Schema.Types.ObjectId, ref: DbCollection.taskStatus },
    estimatedTime: { type: Number, default: 0 },
    totalLoggedTime: { type: Number, default: 0 },
    createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
    updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
    deletedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
    deletedAt: { type: Date }
  },
  reportMembers: {
    type: Array,
    userId: { type: Schema.Types.ObjectId, ref: DbCollection.users },
    totalLoggedTime: { type: Number, default: 0 },
    taskWiseTimeLog: {
      type: Array,
      taskId: { type: Schema.Types.ObjectId, ref: DbCollection.tasks },
      totalLoggedTime: { type: Number, default: 0 },
      loggedAt: { type: Date }
    },
    isRemoved: { type: Boolean, default: false }
  },
  ...commonSchemaFields
});

// plugins
sprintReportSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
