import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";

// Add new feedback
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { feedback } = body;

    if (!feedback || feedback.trim() === "") {
      return NextResponse.json({ error: "Feedback is required." }, { status: 400 });
    }

    const newFeedback = new Feedback({ feedback });
    await newFeedback.save();

    return NextResponse.json({ message: "Feedback submitted successfully.", feedback: newFeedback });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}

// Get all feedbacks
export async function GET() {
  try {
    await connectDB();
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }); // latest first
    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch feedbacks." }, { status: 500 });
  }
}
