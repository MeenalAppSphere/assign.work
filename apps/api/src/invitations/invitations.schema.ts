import { Schema } from 'mongoose';
import { mongooseErrorTransformPluginOptions, schemaOptions } from '../shared/schema/base.schema';
import { DbCollection } from '@aavantan-app/models';

const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

export const invitationSchema = new Schema({
  invitedById: {
    type: Schema.Types.ObjectId,
    required: [true, 'Please add invitation created by id'],
    ref: DbCollection.users
  },
  invitedToId: { type: Schema.Types.ObjectId, required: [true, 'Please add invitee id'], ref: DbCollection.users },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: DbCollection.projects,
    required: [true, 'Please add project details !']
  },
  isInviteAccepted: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);


// virtual
invitationSchema.virtual('project', {
  ref: DbCollection.projects,
  localField: 'projectId',
  foreignField: '_id'
});

invitationSchema.virtual('invitedBy', {
  ref: DbCollection.users,
  localField: 'invitedById',
  foreignField: '_id'
});

invitationSchema.virtual('invitedTo', {
  ref: DbCollection.users,
  localField: 'invitedToId',
  foreignField: '_id'
});

// plugins
invitationSchema
  .plugin(mongooseValidationErrorTransform, mongooseErrorTransformPluginOptions);
