import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

MessageSchema.index({ from: 1, to: 1, createdAt: -1 });
MessageSchema.index({ to: 1, from: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
