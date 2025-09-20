// src/app/api/user/all/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { usn: { $regex: search, $options: "i" } },
            { "subjects.subject": { $regex: search, $options: "i" } },
            { "subjects.topics.topic": { $regex: search, $options: "i" } },
            { "subjects.topics.content": { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await Work.find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .select("name usn profileimg createdAt") // return only needed fields
      .lean();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users", details: err.message },
      { status: 500 }
    );
  }
};
