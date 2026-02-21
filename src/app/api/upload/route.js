import { connectDB } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import ChunkUpload from "@/models/ChunkUpload";
import File from "@/models/File";

// In-memory chunk store
const uploadBuffers = new Map();

export async function POST(req) {
  try {
    const form = await req.formData();

    const chunkFile = form.get("chunk");
    const uploadId = form.get("uploadId");
    const index = Number(form.get("index"));
    const total = Number(form.get("total"));
    const filename = form.get("filename") || "file";

    if (!chunkFile || !uploadId) {
      return Response.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Convert chunk → Buffer
    const buffer = Buffer.from(await chunkFile.arrayBuffer());

    // Get or create entry
    let entry = uploadBuffers.get(uploadId);
    if (!entry) {
      entry = {
        chunks: new Array(total),
        received: 0,
        total,
        bytes: 0,
        filename,
      };
      uploadBuffers.set(uploadId, entry);
    }

    // Store chunk (avoid duplicates)
    if (!entry.chunks[index]) {
      entry.chunks[index] = buffer;
      entry.received++;
      entry.bytes += buffer.length;
    }

    // Save progress
    await connectDB();
    await ChunkUpload.findOneAndUpdate(
      { uploadId },
      { uploadId, filename, totalChunks: total, $addToSet: { uploadedChunks: index } },
      { upsert: true, new: true }
    );

    // Not final → return
    if (index + 1 !== total) {
      return Response.json({
        success: true,
        index,
        total,
        received: entry.received,
      });
    }

    // Ensure all chunks arrived
    if (entry.received !== entry.total) {
      return Response.json(
        { success: false, error: "Missing chunks", received: entry.received, expected: entry.total },
        { status: 400 }
      );
    }

    // Assemble final buffer
    const finalBuffer = Buffer.concat(entry.chunks);

    // Detect resource type
    const ext = filename.split(".").pop().toLowerCase();
    let resourceType = "raw";
    if (["jpg","jpeg","png","gif","webp","bmp","svg"].includes(ext)) resourceType = "image";
    else if (["mp4","mov","webm","mkv","avi","flv","mpeg"].includes(ext)) resourceType = "video";

    // Upload with retry
    let uploadResult;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: resourceType, folder: "chunk_uploads" },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(finalBuffer);
        });
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise(r => setTimeout(r, attempt * 500));
      }
    }

    // Save DB result
    const saved = await ChunkUpload.findOneAndUpdate(
      { uploadId },
      {
        uploadId,
        filename,
        totalChunks: total,
        completed: true,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url || uploadResult.url,
        resourceType: uploadResult.resource_type,
        bytes: uploadResult.bytes,
      },
      { upsert: true, new: true }
    );

    // Create File record
    try {
      const newFile = new File({
        originalName: filename,
        fileid: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mimeType: uploadResult.format
          ? `application/${uploadResult.format}`
          : "application/octet-stream",
        size: uploadResult.bytes,
        cloudinaryUrl: uploadResult.secure_url || uploadResult.url,
        publicId: uploadResult.public_id,
      });

      await newFile.save();
    } catch (e) {
      console.error("File save failed:", e);
    }

    // Cleanup memory
    uploadBuffers.delete(uploadId);

    return Response.json({ success: true, final: true, result: uploadResult });
  } catch (err) {
    console.error("/api/upload error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}