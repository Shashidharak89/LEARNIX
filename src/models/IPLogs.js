import mongoose from "mongoose";

const IPLogsSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    version: { type: String, default: "" },
    city: { type: String, default: "" },
    region: { type: String, default: "" },
    country_name: { type: String, default: "" },
    org: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.IPLogs || mongoose.model("IPLogs", IPLogsSchema);
