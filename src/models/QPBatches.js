import mongoose from "mongoose";

const QPBatchesSchema = new mongoose.Schema({
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    keywords: { type: [String], default: [] }
}, { timestamps: true });

delete mongoose.models.QPBatches;
export default mongoose.model("QPBatches", QPBatchesSchema);
