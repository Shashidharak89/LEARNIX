import mongoose from "mongoose";

const DailyQuizSchema = new mongoose.Schema({
  dateStr: { type: String, required: true }, // Format: YYYY-MM-DD
  category: { type: String, required: true, default: "random" }, // e.g. "Computer Science", "Mathematics", etc.
  questions: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

DailyQuizSchema.index({ dateStr: 1, category: 1 }, { unique: true });

export default mongoose.models.DailyQuiz || mongoose.model("DailyQuiz", DailyQuizSchema);
