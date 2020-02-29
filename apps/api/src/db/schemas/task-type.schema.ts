import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { commonSchemaFields, mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskTypeSchema = new Schema({
  name: { type: String, required: [true, 'Task type name is required'], text: true },
  color: { type: String, required: [true, 'Task type color is required'] },
  displayName: { type: String, required: [true, 'Task type display name is required'] },
  projectId: { type: Schema.Types.ObjectId, ref: DbCollection.projects, required: [true, 'Project name is required'] },
  description: { type: String },
  ...commonSchemaFields
}, schemaOptions);

// options
taskTypeSchema
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

// virtual
taskTypeSchema
  .virtual('project', {
    ref: DbCollection.projects,
    localField: 'projectId',
    foreignField: '_id'
  });


// plugins
taskTypeSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
