import mongoose from "mongoose";

const SMFilesSchema = new mongoose.Schema({
    name: { type: String, required: false },
    fileurl: { type: String, required: true },
    sub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SMSubject",
        required: true
    }
}, { timestamps: true, strictPopulate: false });

if (mongoose.models.SMFiles) {
    delete mongoose.models.SMFiles;
}
export default mongoose.model("SMFiles", SMFilesSchema);
