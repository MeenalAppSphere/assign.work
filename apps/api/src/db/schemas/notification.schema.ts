import { Schema, Types } from 'mongoose';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');


export const notificationSchema = new Schema({
  description: { type: String, required: [true, 'Notification description is required'] },
  projectId: { type: Types.ObjectId, ref: DbCollection.projects, required: [true, 'Project name is required'] },
  userId: { type: Types.ObjectId, ref: DbCollection.users, required: [true, 'User not found'] },
  isRead: { type: Boolean, default: false },
  ...commonSchemaFields
}, schemaOptions);


// options
notificationSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });


// virtual
notificationSchema
  .virtual('project', {
    ref: DbCollection.projects,
    localField: 'projectId',
    foreignField: '_id'
  });

notificationSchema
  .virtual('user', {
    ref: DbCollection.users,
    localField: 'userId',
    foreignField: '_id',
    justOne: true
  });

notificationSchema
  .virtual('createdBy', {
    ref: DbCollection.users,
    localField: 'createdById',
    foreignField: '_id',
    justOne: true
  });

// plugins
notificationSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
