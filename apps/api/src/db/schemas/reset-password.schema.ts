import { Schema } from 'mongoose';
import { mongooseErrorTransformPluginOptions, schemaOptions } from './base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const resetPasswordSchema = new Schema({
  emailId: { type: String },
  code: { type: String },
  resetPasswordAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  isExpired: { type: Boolean, default: false }
}, schemaOptions);

// plugins
resetPasswordSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
