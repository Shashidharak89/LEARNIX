import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  topic: { type: String },
  content: { type: String, default: "" },
  images: { type: [String], default: [] },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SubjectSchema = new mongoose.Schema({
  subject: { type: String },
  topics: { type: [TopicSchema], default: [] }
}, { _id: false });

const WorkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  password: { type: String }, // not required initially
  subjects: { type: [SubjectSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Work || mongoose.model("Work", WorkSchema);
