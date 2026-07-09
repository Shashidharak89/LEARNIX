import mongoose from "mongoose";

const SMUniversitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    city: { type: String, default: null },
    district: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.SMUniversity || mongoose.model("SMUniversity", SMUniversitySchema);
