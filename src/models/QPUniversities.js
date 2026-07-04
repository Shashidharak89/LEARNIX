import mongoose from "mongoose";

const QPUniversitiesSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    city: { type: String, default: null },
    state: { type: String, default: null },
    district: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.QPUniversities || mongoose.model("QPUniversities", QPUniversitiesSchema);
