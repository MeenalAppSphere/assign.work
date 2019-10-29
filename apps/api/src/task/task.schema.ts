import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';

export const taskSchema = new Schema({
  name: { type: String, required: [true, 'Please Add task name'] },
  description: { type: String },
  closed: { type: Boolean, default: false },
  displayName: { type: String },
  dueReminder: { type: String },
  dueDate: { type: Date },
  dueComplete: { type: Boolean, default: false },
  stage: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: DbCollection.projects },
  position: { type: Number },
  priority: { type: String },
  tags: [],
  assigned: [{
    type: Array,
    ref: DbCollection.users
  }],
  url: { type: String },
  progress: { type: String },
  totalLoggedTime: { type: Number },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
});
