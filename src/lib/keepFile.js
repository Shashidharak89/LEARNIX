import cloudinary from "@/lib/cloudinary";
import { KEEP_FILE_LIMIT } from "@/lib/keepFields";

export function keepFileFolder(userId) {
  return `learnix_keep/${userId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function ownsKeepFile(userId, file) {
  const prefix = `${keepFileFolder(userId)}/`;
  return typeof file?.publicId === "string" &&
    file.publicId.startsWith(prefix) &&
    /^[a-zA-Z0-9._-]+$/.test(file.publicId.slice(prefix.length));
}

export function normalizeKeepFile(userId, file) {
  if (!ownsKeepFile(userId, file) || !Number.isSafeInteger(file.size) ||
      file.size < 0 || file.size > KEEP_FILE_LIMIT) return null;
  return {
    publicId: file.publicId,
    name: typeof file.name === "string" ? file.name.slice(0, 250) : "Saved file",
    size: file.size,
    resourceType: "raw",
    mimeType: typeof file.mimeType === "string" ? file.mimeType.slice(0, 150) : "application/octet-stream",
  };
}

export async function removeKeepFile(userId, file) {
  if (!ownsKeepFile(userId, file)) return;
  try {
    await cloudinary.uploader.destroy(file.publicId, { resource_type: "raw", type: "authenticated" });
  } catch (error) {
    console.error("Keep file cleanup failed:", error.message);
  }
}
