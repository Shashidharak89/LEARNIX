import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyQuiz from "@/models/DailyQuiz";
import DailyQuizEnrollment from "@/models/DailyQuizEnrollment";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function POST(req) {
  try {
    await connectDB();
    const userResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!userResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { score, timeTakenMs, dateStr, quizDayId, category = 'random' } = await req.json();

    if (timeTakenMs == null || score == null || !dateStr || !quizDayId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if the user already played today in this category
    const existing = await DailyQuizEnrollment.findOne({ userId: userResult.user._id, dateStr, category });
    if (existing) {
      return NextResponse.json({ error: `You have already participated in the ${category} quiz today` }, { status: 400 });
    }

    const newEnrollment = await DailyQuizEnrollment.create({
      userId: userResult.user._id,
      quizDayId,
      dateStr,
      category,
      score,
      timeTakenMs
    });

    return NextResponse.json({ success: true, enrollment: newEnrollment });
  } catch (error) {
    console.error("Daily Quiz POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
