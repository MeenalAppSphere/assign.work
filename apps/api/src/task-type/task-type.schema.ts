import { Schema } from 'mongoose';
import { schemaOptions } from '../shared/schema/base.schema';
import { DbCollection } from '@aavantan-app/models';

export const taskTypeSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  displayName: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: DbCollection.projects, required: true },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);

// options
taskTypeSchema
  .set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
      debugger;
      ret.id = ret._id;
    }
  })
  .set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      debugger;
      ret.id = ret._id;
    }
  });
