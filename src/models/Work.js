import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  topic: { type: String },
  content: { type: String, default: "" },
  images: { type: [String], default: [] }, // list of image URLs
  timestamp: { type: Date, default: Date.now } // timestamp per topic
}, { _id: false });

const SubjectSchema = new mongoose.Schema({
  subject: { type: String },
  topics: { type: [TopicSchema], default: [] }
}, { _id: false });

const WorkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  subjects: { type: [SubjectSchema], default: [] },
  createdAt: { type: Date, default: Date.now } // timestamp for whole record
});

export default mongoose.models.Work || mongoose.model("Work", WorkSchema);
