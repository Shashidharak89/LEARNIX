import mongoose from "mongoose";

const QPImagesSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPSubjects",
        required: true
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPColleges",
        required: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPBatches",
        required: true
    },
    examtype: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPExamType",
        required: true
    },
    imageUrls: {
        type: [String],
        default: []
    },
    visitLink: {
        type: String,
        default: null
    }
}, { timestamps: true });

export default mongoose.models.QPImages || mongoose.model("QPImages", QPImagesSchema);
