import mongoose from "mongoose";

const QPBatchesSchema = new mongoose.Schema({
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.QPBatches || mongoose.model("QPBatches", QPBatchesSchema);
