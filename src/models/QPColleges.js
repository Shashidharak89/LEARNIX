import mongoose from "mongoose";

const QPCollegesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPUniversities",
        required: true
    },
    location: { type: String, default: null },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.QPColleges;
export default mongoose.model("QPColleges", QPCollegesSchema);
