import mongoose from "mongoose";

const DailyQuizSchema = new mongoose.Schema({
  dateStr: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  questions: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.DailyQuiz || mongoose.model("DailyQuiz", DailyQuizSchema);
