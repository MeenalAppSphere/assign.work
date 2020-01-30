import { Schema } from 'mongoose';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../../shared/schema/base.schema';
import { DbCollections } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const invitationSchema = new Schema({
  invitedById: {
    type: Schema.Types.ObjectId,
    required: [true, 'Please add invitation created by id'],
    ref: DbCollections.users
  },
  invitationToId: { type: Schema.Types.ObjectId, ref: DbCollections.users },
  invitationToEmailId: { type: String },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollections.projects,
    required: [true, 'Please add project details !']
  },
  isInviteAccepted: { type: Boolean, default: false },
  invitedAt: { type: Number },
  isDeleted: { type: Boolean, default: false },
  isExpired: { type: Boolean, default: false }
}, schemaOptions);


// virtual
invitationSchema.virtual('project', {
  ref: DbCollections.projects,
  localField: 'projectId',
  foreignField: '_id'
});

invitationSchema.virtual('invitedBy', {
  ref: DbCollections.users,
  localField: 'invitedById',
  foreignField: '_id'
});

invitationSchema.virtual('invitationTo', {
  ref: DbCollections.users,
  localField: 'invitationToId',
  foreignField: '_id'
});

// plugins
invitationSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
