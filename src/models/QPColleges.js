import mongoose from "mongoose";

const QPCollegesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPUniversities",
        default: null
    },
    city: { type: String, default: null },
    state: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.QPColleges || mongoose.model("QPColleges", QPCollegesSchema);
