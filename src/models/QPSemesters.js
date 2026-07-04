import mongoose from "mongoose";

const QPSemestersSchema = new mongoose.Schema({
    semesterNumber: { type: Number, required: true },
    name: { type: String, required: true },
    duration: { type: String, default: "6 months" },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure unique semester per college/program
QPSemestersSchema.index({ semesterNumber: 1 }, { unique: true });

export default mongoose.models.QPSemesters || mongoose.model("QPSemesters", QPSemestersSchema);
