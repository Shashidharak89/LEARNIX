import mongoose from "mongoose";

const QuestionPaperSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    batch: { type: String, required: true }, // e.g., "2020", "2021", "2022-2026"
    examType: { type: String, required: true, enum: ["MSE1", "MSE2", "Final", "Quiz"] },
    semester: { type: Number, required: true }, // e.g., 1, 2, 3, ...
    images: [{ type: String, required: true }], // Array of image URLs (from Cloudinary)
    description: { type: String }, // Optional description
    uploadedBy: { type: String }, // Admin name or user info
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.QuestionPaper || mongoose.model("QuestionPaper", QuestionPaperSchema);
