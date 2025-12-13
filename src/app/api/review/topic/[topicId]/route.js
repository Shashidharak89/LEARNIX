import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Topic from "@/models/Topic";

// GET - Get reviews for a specific topic (visible to reviewer and topic uploader)
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { topicId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); // Current user viewing

    if (!topicId) {
      return NextResponse.json(
        { error: "Topic ID is required." },
        { status: 400 }
      );
    }

    // Get the topic to find the uploader
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    // Build query - reviews are visible to:
    // 1. The person who posted the review (reviewerId)
    // 2. The person who uploaded the topic (topic.userId)
    let reviews = [];
    
    if (userId) {
      // If user is the topic uploader, show all reviews for this topic
      if (topic.userId.toString() === userId.toString()) {
        reviews = await Review.find({ topicId })
          .populate("reviewerId", "name usn profileimg")
          .populate("replies.userId", "name usn profileimg")
          .sort({ timestamp: -1 });
      } else {
        // Otherwise, show only reviews posted by this user
        reviews = await Review.find({ 
          topicId, 
          reviewerId: userId 
        })
          .populate("reviewerId", "name usn profileimg")
          .populate("replies.userId", "name usn profileimg")
          .sort({ timestamp: -1 });
      }
    }

    return NextResponse.json({
      reviews,
      isUploader: topic.userId.toString() === (userId ? userId.toString() : ''),
      uploaderId: topic.userId.toString()
    });
  } catch (error) {
    console.error("Error fetching topic reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}
