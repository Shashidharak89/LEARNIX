import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";

// DELETE - Delete a reply from a review
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { reviewId } = await params;
    const body = await req.json();
    const { userId, replyIndex } = body;

    if (!userId || replyIndex === undefined) {
      return NextResponse.json(
        { error: "User ID and reply index are required." },
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

    // Check if reply exists
    if (!review.replies || replyIndex < 0 || replyIndex >= review.replies.length) {
      return NextResponse.json(
        { error: "Reply not found." },
        { status: 404 }
      );
    }

    const reply = review.replies[replyIndex];

    // Only the reply author can delete their reply
    if (reply.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "You are not authorized to delete this reply." },
        { status: 403 }
      );
    }

    // Remove the reply
    review.replies.splice(replyIndex, 1);
    await review.save();

    // Populate and return updated review
    const updatedReview = await Review.findById(reviewId)
      .populate("reviewerId", "name usn profileimg")
      .populate("replies.userId", "name usn profileimg");

    return NextResponse.json({
      message: "Reply deleted successfully.",
      review: updatedReview
    });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { error: "Failed to delete reply." },
      { status: 500 }
    );
  }
}
