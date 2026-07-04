import mongoose from "mongoose";

const QPImagesSchema = new mongoose.Schema({
    semister: { type: String, required: true },
    batches: [{
        batchname: { type: String, required: true },
        final: {
            id: { type: String, required: true },
            imageurls: {
                type: Map,
                of: [String],
                default: {}
            },
            visitlink: {
                type: [String],
                default: []
            }
        }
    }]
}, { timestamps: true });

export default mongoose.models.QPImages || mongoose.model("QPImages", QPImagesSchema);
