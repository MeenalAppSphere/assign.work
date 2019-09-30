import * as mongoose from 'mongoose';
import { MemberTypes, User, UserLoginProviderEnum, UserStatus } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');


export const userSchema = new mongoose.Schema(
  {
    emailId: { type: String, unique: true, required: true },
    userName: { type: String, unique: true },
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
  { timestamps: true }
);
userSchema.plugin(mongooseValidationErrorTransform, {
  capitalize: true,
  humanize: true,
  transform: function(msg) {
    return msg;
  }
});
