import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyQuizEnrollment from "@/models/DailyQuizEnrollment";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('dateStr');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!dateStr) {
      return NextResponse.json({ error: "dateStr is required" }, { status: 400 });
    }

    // Fetch leaderboard for the date, sorted by score (desc), then timeTakenMs (asc)
    const leaderboard = await DailyQuizEnrollment.find({ dateStr })
      .populate('userId', 'name profileimg usn')
      .sort({ score: -1, timeTakenMs: 1 })
      .skip(skip)
      .limit(limit);

    const total = await DailyQuizEnrollment.countDocuments({ dateStr });
    const hasMore = skip + leaderboard.length < total;

    return NextResponse.json({ leaderboard, hasMore, total });
  } catch (error) {
    console.error("Daily Quiz Leaderboard GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
