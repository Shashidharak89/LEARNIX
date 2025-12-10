import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  topic: { type: String, required: true },
  content: { type: String, default: "" },
  images: { type: [String], default: [] },
  public: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
});

// Index to ensure efficient queries
TopicSchema.index({ userId: 1, subjectId: 1 });
TopicSchema.index({ subjectId: 1 });

export default mongoose.models.Topic || mongoose.model("Topic", TopicSchema);
