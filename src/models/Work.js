import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  topic: { type: String },
  content: { type: String, default: "" },
  images: { type: [String], default: [] },
  timestamp: { type: Date, default: Date.now },
  public: { type: Boolean, default: true } // ✅ public flag
});

const SubjectSchema = new mongoose.Schema({
  subject: { type: String },
  topics: { type: [TopicSchema], default: [] },
  public: { type: Boolean, default: true } // ✅ public flag
});

const WorkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  password: { type: String },
  profileimg: {
    type: String,
    default: "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"
  },
  subjects: { type: [SubjectSchema], default: [] },
  active: { type: Number, default: 0 }, // Active time in minutes
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Work || mongoose.model("Work", WorkSchema);
