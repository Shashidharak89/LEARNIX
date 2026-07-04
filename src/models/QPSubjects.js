import mongoose from "mongoose";

const QPSubjectsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPSemesters",
        required: true
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPColleges",
        required: true
    }
}, { timestamps: true });

export default mongoose.models.QPSubjects || mongoose.model("QPSubjects", QPSubjectsSchema);
