import { Schema } from 'mongoose';
import { DbCollection, UserLoginProviderEnum, UserStatus } from '@aavantan-app/models';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import { MemberTypes } from '@aavantan-app/models';
import { taskSchema } from '../task/task.schema';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');
const paginate = require('mongoose-paginate-v2');

export const userSchema = new Schema(
  {
    emailId: { type: String, required: true, unique: true },
    userName: { type: String },
    password: { type: String },
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
      ref: DbCollection.organizations
    }],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: DbCollection.projects
      }
    ],
    currentOrganizationId: { type: Schema.Types.ObjectId, ref: DbCollection.organizations },
    currentProject: {
      type: Schema.Types.ObjectId,
      ref: DbCollection.projects
    },
    isDeleted: { type: Boolean, default: false }
  }, schemaOptions
);

// options
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
  virtuals: true
});
userSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
  virtuals: true
});

// virtual
userSchema.virtual('currentOrganization', {
  ref: DbCollection.organizations,
  localField: 'currentOrganizationId',
  foreignField: '_id',
  justOne: true
});


// plugins
userSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(paginate);

