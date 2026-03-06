import mongoose from "mongoose";

/**
 * BackupUser — stores a snapshot of a deleted user.
 * Superadmins can view / restore from here.
 * Nothing is auto-deleted from this collection.
 */
const BackupUserSchema = new mongoose.Schema(
  {
    originalId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    name:         { type: String },
    usn:          { type: String },
    password:     { type: String },
    role:         { type: String },
    profileimg:   { type: String },
    token:        { type: String },
    tokenCreatedAt: { type: Date },
    originalCreatedAt: { type: Date },
    deletedAt:    { type: Date, default: Date.now },
    deletedBy:    { type: String }, // USN of the superadmin who deleted
  },
  { timestamps: false }
);

export default mongoose.models.BackupUser ||
  mongoose.model("BackupUser", BackupUserSchema);
