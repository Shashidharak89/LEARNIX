import mongoose from "mongoose";

const ResourcesInteractionSchema = new mongoose.Schema(
  {
    resource_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      unique: true,
      index: true,
    },
    resourceid: {
      type: String,
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

// Keep resourceid string in sync with resource_id
ResourcesInteractionSchema.pre("save", function (next) {
  if (this.resource_id && !this.resourceid) {
    this.resourceid = this.resource_id.toString();
  }
  next();
});

export default mongoose.models.ResourcesInteraction ||
  mongoose.model("ResourcesInteraction", ResourcesInteractionSchema);
