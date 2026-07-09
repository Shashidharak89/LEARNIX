import mongoose from "mongoose";

const SMSemesterSchema = new mongoose.Schema({
    sem: { type: Number, required: true, unique: true }
}, { timestamps: true });

export default mongoose.models.SMSemester || mongoose.model("SMSemester", SMSemesterSchema);
