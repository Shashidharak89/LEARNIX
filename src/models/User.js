import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  profileimg: {
    type: String,
    default: "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"
  },
  token: { type: String, default: null },
  tokenCreatedAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  streaks: { type: Number, default: 1 },
  highestStreak: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
