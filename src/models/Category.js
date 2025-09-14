import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: { type: [TopicSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const SemesterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: { type: [SubjectSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  semesters: { type: [SemesterSchema], default: [] }
});

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
