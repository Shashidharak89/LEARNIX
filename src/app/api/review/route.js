import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Topic from "@/models/Topic";
import User from "@/models/User";

// POST - Create a new review for a topic
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { topicId, reviewerId, type, message } = body;

    // Validate required fields
    if (!topicId || !reviewerId || !message) {
      return NextResponse.json(
        { error: "Topic ID, reviewer ID, and message are required." },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    // Check if reviewer exists
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer not found." },
        { status: 404 }
      );
    }

    // Prevent users from reviewing their own topics
    if (topic.userId.toString() === reviewerId.toString()) {
      return NextResponse.json(
        { error: "You cannot review your own topic." },
        { status: 400 }
      );
    }

    // Create new review
    const newReview = new Review({
      topicId,
      reviewerId,
      type: type || "feedback",
      message: message.trim()
    });

    await newReview.save();

    // Populate reviewer info for response
    const populatedReview = await Review.findById(newReview._id)
      .populate("reviewerId", "name usn profileimg");

    return NextResponse.json({
      message: "Review submitted successfully.",
      review: populatedReview
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to submit review." },
      { status: 500 }
    );
  }
}

// GET - Get all reviews (admin or general purpose)
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");
    const reviewerId = searchParams.get("reviewerId");

    let query = {};
    
    if (topicId) {
      query.topicId = topicId;
    }
    
    if (reviewerId) {
      query.reviewerId = reviewerId;
    }

    const reviews = await Review.find(query)
      .populate("reviewerId", "name usn profileimg")
      .populate("replies.userId", "name usn profileimg")
      .sort({ timestamp: -1 });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}
