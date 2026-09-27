import cloudinary from "./cloudinary.js";
import File from "../models/File.js";

/**
 * Utility to delete files older than 24 hours from both MongoDB and Cloudinary.
 */
export async function cleanupExpiredFiles() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredFiles = await File.find({ createdAt: { $lt: cutoff } });

    for (const f of expiredFiles) {
      if (f.publicId) {
        try {
          // Attempt destruction across possible Cloudinary resource types
          await cloudinary.uploader.destroy(f.publicId, { resource_type: "raw" });
          await cloudinary.uploader.destroy(f.publicId, { resource_type: "image" });
          await cloudinary.uploader.destroy(f.publicId, { resource_type: "video" });
          await cloudinary.uploader.destroy(f.publicId, { resource_type: "auto" });
        } catch (err) {
          console.error(`Cloudinary cleanup error for publicId ${f.publicId}:`, err);
        }
      }
      await File.deleteOne({ _id: f._id });
    }
  } catch (err) {
    console.error("Cleanup expired files error:", err);
  }
}
