import mongoose from "mongoose";

const ImageGenerationSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    prompt: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    triggerRunId: { type: String, default: null },
    cloudinaryUrl: { type: String, default: "" },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.ImageGeneration ||
  mongoose.model("ImageGeneration", ImageGenerationSchema);
