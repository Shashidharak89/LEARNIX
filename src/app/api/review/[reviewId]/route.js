import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Topic from "@/models/Topic";
import User from "@/models/User";

// POST - Add a reply to a review (only topic uploader can reply)
export async function POST(req, { params }) {
  try {
    await connectDB();
    const { reviewId } = await params;
    const body = await req.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "User ID and message are required." },
        { status: 400 }
      );
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    // Find the topic to verify uploader
    const topic = await Topic.findById(review.topicId);
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Only the topic uploader or the original reviewer can reply
    const isUploader = topic.userId.toString() === userId;
    const isReviewer = review.reviewerId.toString() === userId;

    if (!isUploader && !isReviewer) {
      return NextResponse.json(
        { error: "You are not authorized to reply to this review." },
        { status: 403 }
      );
    }

    // Add reply to the review
    review.replies.push({
      userId,
      message: message.trim(),
      timestamp: new Date()
    });

    // Mark as read if uploader is replying
    if (isUploader) {
      review.isRead = true;
    }

    await review.save();

    // Populate and return updated review
    const updatedReview = await Review.findById(reviewId)
      .populate("reviewerId", "name usn profileimg")
      .populate("replies.userId", "name usn profileimg");

    return NextResponse.json({
      message: "Reply added successfully.",
      review: updatedReview
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json(
      { error: "Failed to add reply." },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review (only reviewer can delete their own review)
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { reviewId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    // Only the reviewer can delete their review
    if (review.reviewerId.toString() !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to delete this review." },
        { status: 403 }
      );
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({
      message: "Review deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review." },
      { status: 500 }
    );
  }
}
