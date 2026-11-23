import mongoose from "mongoose";

const SMBatchSchema = new mongoose.Schema({
    startyear: { type: Number, required: true },
    endyear: { type: Number, required: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.SMBatch;
export default mongoose.model("SMBatch", SMBatchSchema);
