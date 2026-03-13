import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Feedback from "@/models/Feedback";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return await User.findById(decoded.userId).lean();
  } catch {
    return null;
  }
}

export const GET = async (req) => {
  try {
    await connectDB();

    const caller = await getCallerFromBearer(req);
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const total = await Feedback.countDocuments({});
    const feedbacks = await Feedback.find({})
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .select("feedback createdAt updatedAt")
      .lean();

    return NextResponse.json({
      feedbacks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin feedbacks fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
};
