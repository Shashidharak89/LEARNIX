import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";

// GET /api/user/all?query=...&page=1&limit=10
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Search conditions
    const searchCondition = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { usn: { $regex: query, $options: "i" } },
            { "subjects.subject": { $regex: query, $options: "i" } },
            { "subjects.topics.topic": { $regex: query, $options: "i" } },
          ],
        }
      : {};

    // Fetch users with pagination
    const users = await Work.find(searchCondition, "name usn profileimg createdAt")
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Count for frontend (optional)
    const total = await Work.countDocuments(searchCondition);

    return NextResponse.json(
      { success: true, users, total },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
