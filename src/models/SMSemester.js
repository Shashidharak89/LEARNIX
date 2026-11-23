import mongoose from "mongoose";

const SMSemesterSchema = new mongoose.Schema({
    sem: { type: Number, required: true, unique: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.SMSemester;
export default mongoose.model("SMSemester", SMSemesterSchema);
