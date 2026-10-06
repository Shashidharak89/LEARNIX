import cloudinary from "./cloudinary.js";

/**
 * Uploads a Buffer to Cloudinary safely.
 * Uses `upload_large_stream` for buffers larger than 5MB to handle
 * large files (PDFs, videos, zip archives, high-res images) without hitting Cloudinary size limits.
 *
 * @param {Buffer} buffer - File buffer to upload
 * @param {Object} options - Upload configuration options (folder, filename)
 * @returns {Promise<Object>} Cloudinary upload result object
 */
export async function uploadBufferToCloudinary(buffer, options = {}) {
  const { folder = "updates", filename = `upload-${Date.now()}` } = options;

  const sanitizedName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  const isLarge = buffer.length > 5 * 1024 * 1024; // > 5MB

  return new Promise((resolve, reject) => {
    const streamParams = {
      folder,
      resource_type: "auto",
      public_id: `${Date.now()}_${sanitizedName}`,
    };

    if (isLarge) {
      streamParams.chunk_size = 6 * 1024 * 1024; // 6MB chunks for Cloudinary large stream
    }

    const callback = (error, result) => {
      if (error) reject(error);
      else resolve(result);
    };

    const uploadStream = isLarge
      ? cloudinary.uploader.upload_large_stream(streamParams, callback)
      : cloudinary.uploader.upload_stream(streamParams, callback);

    uploadStream.end(buffer);
  });
}
