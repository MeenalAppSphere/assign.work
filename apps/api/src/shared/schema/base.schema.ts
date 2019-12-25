import { SchemaOptions } from 'mongoose';

export const schemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    // getters: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
    }
  },
  id: true
};

export const mongooseErrorTransformPluginOptions = {
  capitalize: true,
  humanize: true,
  transform: function(msg) {
    return msg;
  }
};
