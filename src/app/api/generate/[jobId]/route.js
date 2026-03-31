import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ImageGeneration from "@/models/ImageGeneration";

export async function GET(req, { params }) {
  try {
    const jobId = params?.jobId;
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    await connectDB();
    const record = await ImageGeneration.findById(jobId).lean();

    if (!record) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        jobId: record._id.toString(),
        status: record.status,
        cloudinaryUrl: record.cloudinaryUrl || "",
        error: record.error || "",
        prompt: record.prompt || "",
        createdAt: record.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/generate/[jobId] error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
