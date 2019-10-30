import { Schema } from 'mongoose';
import { DbCollection } from '@aavantan-app/models';

export const taskSchema = new Schema({
  name: { type: String, required: [true, 'Please Add task name'] },
  description: { type: String },
  displayName: { type: String },
  dueReminder: { type: String },
  dueDate: { type: Date },
  dueComplete: { type: Boolean, default: false },
  stage: { type: String },
  taskType: { type: String },
  project: { type: Schema.Types.ObjectId, ref: DbCollection.projects, required: [true, 'Please Select Project First!'] },
  position: { type: Number },
  priority: { type: String },
  tags: [],
  comments: [],
  assignee: { type: Schema.Types.ObjectId, ref: DbCollection.users },
  assigned: [{
    type: Array,
    ref: DbCollection.users
  }],
  url: { type: String },
  progress: { type: Number },
  loggedTime: [],
  totalLoggedTime: { type: Number },
  estimateTime: { type: Number },
  status: { type: String },
  sprint: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: DbCollection.users, required: false },
  isDeleted: { type: Boolean, default: false }
});
