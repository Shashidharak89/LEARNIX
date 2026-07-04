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
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QPCourse",
        required: true
    }
}, { timestamps: true });

delete mongoose.models.QPSubjects;
export default mongoose.model("QPSubjects", QPSubjectsSchema);
