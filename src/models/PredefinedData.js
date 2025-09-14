import mongoose from "mongoose";

const PredefinedDataSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['semesters', 'subjects', 'topics']
  },
  values: { type: [String], required: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.PredefinedData || mongoose.model("PredefinedData", PredefinedDataSchema);