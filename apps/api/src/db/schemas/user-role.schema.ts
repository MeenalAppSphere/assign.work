import { Schema, Types } from 'mongoose';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const userRoleSchema = new Schema({
  name: { type: String, required: [true, 'Role name is required'], text: true },
  description: { type: String },
  accessPermissions : { type : Object},
  projectId: { type: Types.ObjectId, ref: DbCollection.projects, required: [true, 'Project id is required'] },
  ...commonSchemaFields
}, schemaOptions);

// options
userRoleSchema
  .set('toObject', { virtuals: true })
  .set('toJSON', { virtuals: true });

userRoleSchema
  .virtual('project', {
    ref: DbCollection.projects,
    localField: 'projectId',
    foreignField: '_id'
  });


// plugins
userRoleSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
