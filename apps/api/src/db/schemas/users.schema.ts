import { Schema } from "mongoose";
import { DbCollection, MemberTypes, UserLoginProviderEnum, UserStatus } from "@aavantan-app/models";
import { mongooseErrorTransformPluginOptions, schemaOptions } from "./base.schema";

const mongooseValidationErrorTransform = require("mongoose-validation-error-transform");
const uniqueValidator = require("mongoose-unique-validator");

export const userSchema = new Schema(
  {
    emailId: {
      type: String, required: true, index: { unique: true },
      uniqueCaseInsensitive: true
    },
    userName: { type: String },
    password: { type: String },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    profilePic: { type: String },
    confirmed: { type: Boolean, default: false },
    locale: { type: String },
    mobileNumber: { type: String },
    status: { type: String, enum: Object.values(UserStatus) },
    lastLoginProvider: { type: String, enum: Object.values(UserLoginProviderEnum) },
    memberType: { type: String, enum: Object.values(MemberTypes) },
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
userSchema.set("toJSON", {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
  virtuals: true
});
userSchema.set("toObject", {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
  virtuals: true
});

// virtual
userSchema.virtual("currentOrganization", {
  ref: DbCollection.organizations,
  localField: "currentOrganizationId",
  foreignField: "_id",
  justOne: true
});


// plugins
userSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions)
  .plugin(uniqueValidator, { message: "{PATH} already exists :- {VALUE}" });

