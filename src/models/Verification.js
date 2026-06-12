import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 } // Auto delete after 30 mins
});

export default mongoose.models.Verification || mongoose.model("Verification", VerificationSchema);
