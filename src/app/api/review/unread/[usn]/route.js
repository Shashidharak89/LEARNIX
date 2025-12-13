import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Topic from "@/models/Topic";
import User from "@/models/User";

// GET - Get unread reviews count for a user's topics
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { usn } = await params;

    if (!usn) {
      return NextResponse.json(
        { error: "USN is required." },
        { status: 400 }
      );
    }

    // Find user by USN
    const user = await User.findOne({
      usn: { $regex: new RegExp(`^${usn.trim()}$`, "i") }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Find all topics by this user
    const topics = await Topic.find({ userId: user._id }).select("_id");
    const topicIds = topics.map(t => t._id);

    // Count unread reviews on user's topics
    const unreadCount = await Review.countDocuments({
      topicId: { $in: topicIds },
      isRead: false
    });

    return NextResponse.json({
      unreadCount,
      userId: user._id
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count." },
      { status: 500 }
    );
  }
}
