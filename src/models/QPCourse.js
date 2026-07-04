import mongoose from "mongoose";

const QPCourseSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true });

// Prevent caching in dev
delete mongoose.models.QPCourse;
export default mongoose.model("QPCourse", QPCourseSchema);
