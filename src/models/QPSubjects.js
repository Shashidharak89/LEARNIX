import mongoose from "mongoose";

const QPSubjectsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPSemesters",
        default: null
    },
    credits: { type: Number, default: 4 },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPColleges",
        default: null
    },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.QPSubjects || mongoose.model("QPSubjects", QPSubjectsSchema);
