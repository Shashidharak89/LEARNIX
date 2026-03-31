import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ImageGeneration from "@/models/ImageGeneration";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const userId = body?.userId || null;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    await connectDB();

    const record = await ImageGeneration.create({
      prompt,
      userId,
      status: "pending",
    });

    const runHandle = await tasks.trigger("image-generation", {
      generationId: record._id.toString(),
      prompt,
    });

    record.triggerRunId = runHandle?.id || null;
    await record.save();

    return NextResponse.json(
      { status: "processing", jobId: record._id.toString(), runId: record.triggerRunId },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/generate error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
