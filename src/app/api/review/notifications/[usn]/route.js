import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Topic from "@/models/Topic";
import User from "@/models/User";

// GET - Get review notifications for a user's topics (reviews they received as uploader)
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { usn } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

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

    // Find all topics by this user with subject info
    const topics = await Topic.find({ userId: user._id })
      .populate("subjectId", "subject")
      .select("_id topic subjectId");
    
    const topicIds = topics.map(t => t._id);

    // Create a map of topicId -> topic info for quick lookup
    const topicMap = {};
    topics.forEach(t => {
      topicMap[t._id.toString()] = {
        topicName: t.topic,
        subjectName: t.subjectId?.subject || "Unknown Subject"
      };
    });

    // Get total count of reviews
    const totalCount = await Review.countDocuments({
      topicId: { $in: topicIds }
    });

    // Count unread (all unread, not just current page)
    const unreadCount = await Review.countDocuments({
      topicId: { $in: topicIds },
      isRead: false
    });

    // Get paginated reviews on user's topics, sorted by newest first
    const reviews = await Review.find({
      topicId: { $in: topicIds }
    })
      .populate("reviewerId", "usn name profileimg")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Format notifications
    const notifications = reviews.map(review => {
      const topicInfo = topicMap[review.topicId.toString()] || {};
      return {
        _id: review._id,
        topicId: review.topicId,
        topicName: topicInfo.topicName || "Unknown Topic",
        subjectName: topicInfo.subjectName || "Unknown Subject",
        reviewerUsn: review.reviewerId?.usn || "Unknown",
        reviewerName: review.reviewerId?.name || "Unknown User",
        reviewerImg: review.reviewerId?.profileimg || "",
        type: review.type,
        message: review.message,
        isRead: review.isRead,
        timestamp: review.timestamp
      };
    });

    const hasMore = skip + reviews.length < totalCount;

    return NextResponse.json({
      notifications,
      unreadCount,
      total: totalCount,
      page,
      limit,
      hasMore
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
