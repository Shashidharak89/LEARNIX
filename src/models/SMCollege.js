import mongoose from "mongoose";

const SMCollegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMUniversity",
        required: true
    },
    location: { type: String, default: null },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.SMCollege;
export default mongoose.model("SMCollege", SMCollegeSchema);
