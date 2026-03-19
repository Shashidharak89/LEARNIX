import mongoose from "mongoose";

const PublicTextSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400,
    },
  },
  {
    versionKey: false,
  }
);

export default mongoose.models.PublicText || mongoose.model("PublicText", PublicTextSchema);
