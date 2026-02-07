import mongoose from "mongoose";

const TextShareSchema = new mongoose.Schema({
  text: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  editAccess: { type: Boolean, default: false }, // if true, anyone can edit; if false, view only
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
});

export default mongoose.models.TextShare || mongoose.model("TextShare", TextShareSchema);
