import mongoose from "mongoose";

const ContentItemSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" }, // small description
    files: [{ type: String }], // cloudinary URLs in order
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SubjectSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    items: [ContentItemSchema], // list of content items for this subject
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const WorkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    contents: [SubjectSchema], // subjects
  },
  { timestamps: true }
);

export default mongoose.models.Work || mongoose.model("Work", WorkSchema);
