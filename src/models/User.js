import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  password: { type: String },
  profileimg: {
    type: String,
    default: "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"
  },
  token: { type: String, default: null },
  tokenCreatedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
