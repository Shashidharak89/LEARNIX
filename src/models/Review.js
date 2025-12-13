import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ReviewSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who posted the review
  type: { 
    type: String, 
    enum: ["feedback", "suggestion", "mistake", "appreciation"], 
    default: "feedback" 
  },
  message: { type: String, required: true },
  replies: { type: [ReplySchema], default: [] },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for efficient queries
ReviewSchema.index({ topicId: 1 });
ReviewSchema.index({ reviewerId: 1 });
ReviewSchema.index({ timestamp: -1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
