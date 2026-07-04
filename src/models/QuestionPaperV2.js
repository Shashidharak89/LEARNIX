import mongoose from "mongoose";

const QuestionPaperV2Schema = new mongoose.Schema({
    title: { type: String, required: true },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPUniversities",
        default: null
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPColleges",
        default: null
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPSubjects",
        default: null
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPSemesters",
        default: null
    },
    examType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPExamType",
        default: null
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPBatches",
        default: null
    },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    totalQuestions: { type: Number, default: 0 },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.QuestionPaperV2 || mongoose.model("QuestionPaperV2", QuestionPaperV2Schema);
