import mongoose from "mongoose";

const TopicCategorySchema = new mongoose.Schema({
  topic: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SubjectCategorySchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topics: { type: [TopicCategorySchema], default: [] },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SemesterCategorySchema = new mongoose.Schema({
  semester: { type: String, required: true },
  subjects: { type: [SubjectCategorySchema], default: [] },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const CategoriesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  semesters: { type: [SemesterCategorySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Categories || mongoose.model("Categories", CategoriesSchema);