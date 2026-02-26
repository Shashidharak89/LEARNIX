import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  name: { type: String },
  resourceType: { type: String, default: 'raw' },
}, { _id: false });

const UpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  links: [{ type: String }],
  files: [FileSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export default mongoose.models.Update || mongoose.model('Update', UpdateSchema);