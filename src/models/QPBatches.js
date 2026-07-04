import mongoose from "mongoose";

const QPBatchesSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    name: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Compound unique index
QPBatchesSchema.index({ year: 1 }, { unique: true });

export default mongoose.models.QPBatches || mongoose.model("QPBatches", QPBatchesSchema);
