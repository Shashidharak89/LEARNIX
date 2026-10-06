import cloudinary from "./cloudinary.js";

/**
 * Delete a file from Cloudinary by publicId.
 * Attempts with the specified resourceType first (or 'image' / 'raw' / 'video'),
 * and tries fallback types if the initial attempt returned 'not found'.
 *
 * @param {string} publicId - Cloudinary publicId
 * @param {string} [resourceType] - 'image', 'video', 'raw', or 'auto'
 * @returns {Promise<{ success: boolean, result?: string, error?: string }>}
 */
export async function destroyCloudinaryFile(publicId, resourceType) {
  if (!publicId) {
    return { success: false, error: "Missing publicId" };
  }

  const preferredType = resourceType && resourceType !== "auto" ? resourceType : null;
  const candidateTypes = [];
  if (preferredType) candidateTypes.push(preferredType);
  ["image", "raw", "video"].forEach((t) => {
    if (!candidateTypes.includes(t)) candidateTypes.push(t);
  });

  let lastResult = null;
  for (const type of candidateTypes) {
    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
        invalidate: true,
      });
      lastResult = res;
      if (res && res.result === "ok") {
        return { success: true, result: "ok", type };
      }
    } catch (err) {
      console.warn(`Cloudinary destroy error for ${publicId} with type ${type}:`, err?.message || err);
    }
  }

  return { success: true, result: lastResult?.result || "ok" };
}
