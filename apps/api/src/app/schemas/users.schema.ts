import * as mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({
  emailId: { type: String, unique: true, required: true },
  userName: { type: String, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastNam: { type: String },
  profilePic: { type: String },
  confirmed: { type: Boolean },
  locale: { type: String },
  mobileNumber: { type: String },
  status: {},
}, { timestamps: true });
