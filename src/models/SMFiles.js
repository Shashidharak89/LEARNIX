import mongoose from "mongoose";

const SMFilesSchema = new mongoose.Schema({
    fileurl: { type: String, required: true },
    sub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMSubject",
        required: true
    }
}, { timestamps: true });

export default mongoose.models.SMFiles || mongoose.model("SMFiles", SMFilesSchema);
