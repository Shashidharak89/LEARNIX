import mongoose from "mongoose";

const QPCourseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.QPCourse;
export default mongoose.model("QPCourse", QPCourseSchema);
