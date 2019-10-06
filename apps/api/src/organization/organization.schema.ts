import { Schema } from 'mongoose';
import { schemaOptions } from '../shared/schema/base.schema';
import { DbCollection } from '@aavantan-app/models';

export const organizationSchema = new Schema({
  name: { type: String, required: [true, 'Organization Name Is Required'] },
  description: { type: String },
  displayName: { type: String },
  logoUrl: { type: String },
  billableMemberCount: { type: Number },
  activeMembersCount: { type: Number },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  isDeleted: { type: Boolean, default: false }
}, schemaOptions);
