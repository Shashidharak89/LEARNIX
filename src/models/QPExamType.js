import mongoose from "mongoose";

const QPExamTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.QPExamType;
export default mongoose.model("QPExamType", QPExamTypeSchema);
