import mongoose from "mongoose";

const QPExamTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    isInternal: { type: Boolean, default: false },
    maxMarks: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.QPExamType || mongoose.model("QPExamType", QPExamTypeSchema);
