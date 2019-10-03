import * as mongoose from 'mongoose';
import { MemberTypes, UserLoginProviderEnum, UserStatus } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions } from '../shared/schema/base.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export const userSchema = new mongoose.Schema(
  {
    emailId: { type: String, required: true, unique: true },
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
  }, {
    _id: false
  }
);

// virtuals
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});
userSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});


// plugins
userSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(aggregatePaginate);
