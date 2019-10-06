import { Schema } from 'mongoose';
import { DbCollection, UserLoginProviderEnum, UserStatus } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import { MemberTypes } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const userSchema = new Schema(
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
      type: Schema.Types.Mixed
    },
    recentLoginInfo: {
      type: Schema.Types.Mixed
    },
    organizations: [{
      type: Schema.Types.ObjectId,
      ref: DbCollection.organizations,
      required: [true, 'Please select Organization.']
    }],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: DbCollection.projects
      }
    ],
    defaultOrganization: { type: Schema.Types.ObjectId, ref: DbCollection.organizations },
    isDeleted: { type: Boolean, default: false }
  }, schemaOptions
);

// virtual
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
  .plugin(paginate);
