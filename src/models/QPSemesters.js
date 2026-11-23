import mongoose from "mongoose";

const QPSemestersSchema = new mongoose.Schema({
    semesterNumber: { type: Number, required: true, unique: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.QPSemesters;
export default mongoose.model("QPSemesters", QPSemestersSchema);
