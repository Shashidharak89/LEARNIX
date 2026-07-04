import mongoose from "mongoose";

const QPCollegesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPUniversities",
        required: true
    },
    location: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.QPColleges || mongoose.model("QPColleges", QPCollegesSchema);
