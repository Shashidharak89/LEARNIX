import mongoose from "mongoose";

const DailyQuizEnrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quizDayId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyQuiz", required: true },
  dateStr: { type: String, required: true },
  category: { type: String, required: true, default: "random" },
  score: { type: Number, required: true },
  timeTakenMs: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

DailyQuizEnrollmentSchema.index({ userId: 1, dateStr: 1, category: 1 }, { unique: true });

export default mongoose.models.DailyQuizEnrollment || mongoose.model("DailyQuizEnrollment", DailyQuizEnrollmentSchema);
