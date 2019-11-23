import { Schema } from 'mongoose';
import { schemaOptions } from '../shared/schema/base.schema';
import { DbCollection, SprintStatus } from '@aavantan-app/models';

export const sprintSchema = new Schema({
  name: { type: String, required: [true, 'Sprint Name is required'] },
  startedAt: { type: Date, required: [true, 'Sprint start time is required'] },
  endAt: { type: Date, required: [true, 'Sprint end time is required'] },
  goal: { type: String, required: [true, 'Sprint goal is required'] },
  autoUpdate: {
    isAllowed: { type: Boolean, default: false },
    autoUpdateAt: { type: Date }
  },
  sprintStatus: {
    status: {
      type: String,
      enum: Object.values(SprintStatus)
    }
  },
  stages: [

  ],
  createdById: { type: Schema.Types.ObjectId, required: [true, 'Created by is required'], ref: DbCollection.users },
  updatedById: { type: Schema.Types.ObjectId, ref: DbCollection.users }
}, schemaOptions);
