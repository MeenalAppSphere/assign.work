import { Schema } from 'mongoose';
import { DbCollections } from '@aavantan-app/models';
import { schemaOptions } from '../../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const taskTypeSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  displayName: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: DbCollections.projects, required: true },
  createdById: { type: Schema.Types.ObjectId, ref: DbCollections.users, required: true },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollections.users, required: false },
  isDeleted: { type: Boolean, default: false }
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
