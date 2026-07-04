import mongoose from "mongoose";

const QPExamTypeSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.QPExamType || mongoose.model("QPExamType", QPExamTypeSchema);
