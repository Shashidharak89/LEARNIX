import mongoose from "mongoose";

const QPUniversitiesSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    state: { type: String, default: null },
    country: { type: String, default: "India" },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.QPUniversities || mongoose.model("QPUniversities", QPUniversitiesSchema);
