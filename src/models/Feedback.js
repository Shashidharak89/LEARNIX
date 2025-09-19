import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    feedback: { type: String, required: true },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
