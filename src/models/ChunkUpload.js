import mongoose from "mongoose";

const ChunkUploadSchema = new mongoose.Schema({
  uploadId: { type: String, required: true, unique: true },
  filename: { type: String },
  totalChunks: { type: Number },
  uploadedChunks: { type: [Number], default: [] },
  completed: { type: Boolean, default: false },
  publicId: { type: String },
  url: { type: String },
  resourceType: { type: String },
  bytes: { type: Number },
  uploadedBy: { type: String, default: "anonymous" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ChunkUpload || mongoose.model("ChunkUpload", ChunkUploadSchema);
