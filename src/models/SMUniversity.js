import mongoose from "mongoose";

const SMUniversitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    city: { type: String, default: null },
    district: { type: String, default: null },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.SMUniversity;
export default mongoose.model("SMUniversity", SMUniversitySchema);
