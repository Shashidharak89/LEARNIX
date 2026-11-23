import mongoose from "mongoose";

const SMCourseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.SMCourse;
export default mongoose.model("SMCourse", SMCourseSchema);
