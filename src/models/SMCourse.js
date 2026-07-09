import mongoose from "mongoose";

const SMCourseSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.SMCourse || mongoose.model("SMCourse", SMCourseSchema);
