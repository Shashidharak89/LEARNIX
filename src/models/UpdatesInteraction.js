import mongoose from "mongoose";

const UpdatesInteractionSchema = new mongoose.Schema(
  {
    update_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Update",
      required: true,
      unique: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.UpdatesInteraction ||
  mongoose.model("UpdatesInteraction", UpdatesInteractionSchema);
