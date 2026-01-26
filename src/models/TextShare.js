import mongoose from "mongoose";

const TextShareSchema = new mongoose.Schema({
  text: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
});

export default mongoose.models.TextShare || mongoose.model("TextShare", TextShareSchema);
