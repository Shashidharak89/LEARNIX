import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  fileid: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  uploadedBy: { type: String, default: "anonymous" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.File || mongoose.model("File", FileSchema);
