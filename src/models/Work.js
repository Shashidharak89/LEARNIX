import mongoose from "mongoose";

const WorkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    content: { type: String, required: true },
    subject: { type: String, required: true },
    files: [{ type: String }], // Cloudinary file URLs
  },
  { timestamps: true }
);

export default mongoose.models.Work || mongoose.model("Work", WorkSchema);
