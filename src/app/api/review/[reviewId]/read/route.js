import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";

// PATCH - Mark review as read
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { reviewId } = await params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isRead: true },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Review marked as read.",
      review
    });
  } catch (error) {
    console.error("Error marking review as read:", error);
    return NextResponse.json(
      { error: "Failed to mark review as read." },
      { status: 500 }
    );
  }
}
