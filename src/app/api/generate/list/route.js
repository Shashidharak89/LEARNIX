import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ImageGeneration from "@/models/ImageGeneration";

export async function GET() {
  try {
    await connectDB();

    const records = await ImageGeneration.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        items: records.map((record) => ({
          id: record._id.toString(),
          prompt: record.prompt || "",
          status: record.status,
          cloudinaryUrl: record.cloudinaryUrl || "",
          createdAt: record.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/generate/list error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
