// models/Work.js
import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  text: { type: String, default: "" },
  files: { type: [FileSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const SubjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: { type: [ContentSchema], default: [] }
}, { _id: true });

const WorkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  subjects: { type: [SubjectSchema], default: [] }
}, { timestamps: true });

export default mongoose.models.Work || mongoose.model("Work", WorkSchema);
