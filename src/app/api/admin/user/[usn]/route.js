// GET /api/admin/user/[usn]
// Bearer token required — caller must be admin or superadmin
// Returns full user profile + subject/topic counts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const caller = await User.findById(decoded.userId).lean();
    return caller;
  } catch {
    return null;
  }
}

export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const caller = await getCallerFromBearer(req);
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { usn } = await params;
    if (!usn) return NextResponse.json({ error: "USN is required" }, { status: 400 });

    const user = await User.findOne({ usn: usn.toUpperCase() })
      .select("-password -token")
      .lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch subject + topic counts for this user
    const subjects = await Subject.find({ userId: user._id })
      .select("subject public createdAt")
      .lean();

    const subjectIds = subjects.map((s) => s._id);
    const topicCount = await Topic.countDocuments({ userId: user._id });

    return NextResponse.json({
      user: {
        ...user,
        role: user.role || "user",
      },
      subjects,
      subjectCount: subjects.length,
      topicCount,
    });
  } catch (err) {
    console.error("Admin user profile fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
};
