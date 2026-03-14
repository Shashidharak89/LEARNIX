import mongoose from "mongoose";

const RequestMetricSchema = new mongoose.Schema(
  {
    datetime: { type: Date, required: true, unique: true },
    works: { type: Number, default: 0 },
    worksmain: { type: Number, default: 0 },
    quote: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.RequestMetric ||
  mongoose.model("RequestMetric", RequestMetricSchema);