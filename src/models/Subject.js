import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  public: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Index to ensure each user can have multiple subjects with same name
SubjectSchema.index({ userId: 1, subject: 1 });

export default mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
