import mongoose from "mongoose";

const SMCollegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMUniversity",
        required: true
    },
    location: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.SMCollege || mongoose.model("SMCollege", SMCollegeSchema);
