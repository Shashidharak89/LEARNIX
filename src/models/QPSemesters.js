import mongoose from "mongoose";

const QPSemestersSchema = new mongoose.Schema({
    semesterNumber: { type: Number, required: true, unique: true }
}, { timestamps: true });

export default mongoose.models.QPSemesters || mongoose.model("QPSemesters", QPSemestersSchema);
