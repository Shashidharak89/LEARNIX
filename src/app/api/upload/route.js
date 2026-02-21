import { connectDB } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import ChunkUpload from "@/models/ChunkUpload";

// Next.js App Router POST handler
export async function POST(req) {
  try {
    const form = await req.formData();
    const chunkFile = form.get("chunk");
    const indexRaw = form.get("index");
    const totalRaw = form.get("total");
    const uploadId = form.get("uploadId");
    const filename = form.get("filename") || "unknown";

    if (!chunkFile || !uploadId || indexRaw == null || totalRaw == null) {
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400 });
    }

    const index = Number(indexRaw);
    const total = Number(totalRaw);

    // convert chunk to Buffer
    const arrayBuffer = await chunkFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // helper to stream buffer to cloudinary
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const opts = {
          resource_type: "auto",
          upload_id: uploadId,
          chunk_number: index + 1,
          final: index + 1 === total,
          public_id: uploadId
        };

        const cb = (err, result) => {
          if (err) return reject(err);
          resolve(result);
        };

        const uploadStream = cloudinary.uploader.upload_stream(opts, cb);
        uploadStream.on("error", (e) => reject(e));
        uploadStream.end(buffer);
      });

    // retry logic
    let attempts = 0;
    let result = null;
    while (attempts < 3) {
      try {
        result = await streamUpload();
        break;
      } catch (err) {
        attempts += 1;
        if (attempts >= 3) {
          console.error("Chunk upload failed:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
        }
        // small backoff
        await new Promise((r) => setTimeout(r, 500 * attempts));
      }
    }

    // persist progress to DB (do not store file on disk)
    await connectDB();
    if (index + 1 === total) {
      // final chunk: mark completed and save cloudinary result
      await ChunkUpload.findOneAndUpdate(
        { uploadId },
        {
          uploadId,
          filename,
          totalChunks: total,
          completed: true,
          publicId: result.public_id,
          url: result.secure_url || result.url,
          resourceType: result.resource_type,
          bytes: result.bytes
        },
        { upsert: true, new: true }
      );
      return new Response(JSON.stringify({ success: true, final: true, result }), { status: 200 });
    }

    // intermediate chunk: record index
    await ChunkUpload.findOneAndUpdate(
      { uploadId },
      { uploadId, filename, totalChunks: total, $addToSet: { uploadedChunks: index } },
      { upsert: true, new: true }
    );

    return new Response(JSON.stringify({ success: true, index, total }), { status: 200 });
  } catch (err) {
    console.error("/api/upload error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
