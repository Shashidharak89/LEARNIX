import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    feedback: { type: String, required: true },
    pageName: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
