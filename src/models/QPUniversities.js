import mongoose from "mongoose";

const QPUniversitiesSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    city: { type: String, default: null },
    state: { type: String, default: null },
    district: { type: String, default: null },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.QPUniversities;
export default mongoose.model("QPUniversities", QPUniversitiesSchema);
