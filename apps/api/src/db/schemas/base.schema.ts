import { Schema, SchemaOptions } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';

export const schemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
    }
  },
  id: true
};

export const commonSchemaFields = {
  createdById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: [true, 'Created by is required'] },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false },
  deletedById: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false }
};

export const mongooseErrorTransformPluginOptions = {
  capitalize: true,
  humanize: true,
  transform: function(msg) {
    return msg;
  }
};
