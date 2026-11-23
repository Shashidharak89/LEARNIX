import mongoose from "mongoose";

const SMSubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMCollege",
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMCourse",
        required: true
    },
    sem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMSemester",
        required: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMBatch",
        required: true
    },
    keywords: { type: [String], default: [] }
}, { timestamps: true, strictPopulate: false });

delete mongoose.models.SMSubject;
export default mongoose.model("SMSubject", SMSubjectSchema);
