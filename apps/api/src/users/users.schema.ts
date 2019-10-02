import * as mongoose from 'mongoose';
import { DbCollection, MemberTypes, User, UserLoginProviderEnum, UserStatus } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export const userSchema = new mongoose.Schema(
  {
    emailId: { type: String, required: true },
    userName: { type: String },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    profilePic: { type: String },
    confirmed: { type: Boolean, default: false },
    locale: { type: String },
    mobileNumber: { type: String },
    status: { type: String, enum: Object.keys(UserStatus) },
    lastLoginProvider: { type: String, enum: Object.keys(UserLoginProviderEnum) },
    memberType: { type: String, enum: Object.keys(MemberTypes) },
    oneTimeMessagesDismissed: { type: Array },
    timezoneInfo: {
      type: mongoose.Schema.Types.Mixed
    },
    recentLoginInfo: {
      type: mongoose.Schema.Types.Mixed
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed
    },
    projectsId: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  schemaOptions
);

// plugins
userSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(aggregatePaginate);
