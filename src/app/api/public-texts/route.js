import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PublicText from "@/models/PublicText";

const DAY_MS = 24 * 60 * 60 * 1000;

function activeSince() {
  return new Date(Date.now() - DAY_MS);
}

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "3", 10));
    const skip = (page - 1) * limit;

    const filter = { createdAt: { $gte: activeSince() } };

    const total = await PublicText.countDocuments(filter);
    const records = await PublicText.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .select("text createdAt")
      .lean();

    return NextResponse.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error("Public texts fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch public texts" }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const input = typeof body?.text === "string" ? body.text : "";

    if (!input.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (input.length > 4000) {
      return NextResponse.json({ error: "Text is too long (max 4000 characters)" }, { status: 400 });
    }

    const created = await PublicText.create({ text: input });

    return NextResponse.json(
      {
        record: {
          _id: created._id,
          text: created.text,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Public text create error:", err);
    return NextResponse.json({ error: "Failed to create public text" }, { status: 500 });
  }
};
