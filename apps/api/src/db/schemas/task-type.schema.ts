import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';
import { baseSchemaFields, schemaOptions } from './base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskTypeSchema = new Schema({
  name: { type: String, required: true, text: true },
  color: { type: String, required: true },
  displayName: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: DbCollection.projects, required: true },
  ...baseSchemaFields
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


// plugins
taskTypeSchema
  .plugin(mongooseValidationErrorTransform);
