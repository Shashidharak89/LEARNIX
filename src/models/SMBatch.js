import mongoose from "mongoose";

const SMBatchSchema = new mongoose.Schema({
    startyear: { type: Number, required: true },
    endyear: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.SMBatch || mongoose.model("SMBatch", SMBatchSchema);
