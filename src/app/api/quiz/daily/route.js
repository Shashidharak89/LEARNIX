import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyQuiz from "@/models/DailyQuiz";
import DailyQuizEnrollment from "@/models/DailyQuizEnrollment";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function GET(req) {
  try {
    await connectDB();
    const userResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!userResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine the current date string (YYYY-MM-DD)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    let quiz = await DailyQuiz.findOne({ dateStr });

    if (!quiz) {
      // First user of the day triggers fetching 5 random questions
      const res = await fetch("https://opentdb.com/api.php?amount=5");
      const data = await res.json();
      
      if (data.response_code === 0 && data.results.length > 0) {
        // Save the questions to DB
        try {
            quiz = await DailyQuiz.create({
                dateStr,
                questions: data.results
            });
        } catch (e) {
            // In case of a race condition, try to fetch the newly created one
            quiz = await DailyQuiz.findOne({ dateStr });
            if (!quiz) throw e;
        }
      } else {
        return NextResponse.json({ error: "Failed to fetch questions from deck API" }, { status: 500 });
      }
    }

    // Check if user already participated today
    const existingEnrollment = await DailyQuizEnrollment.findOne({ 
      userId: userResult.user._id, 
      dateStr 
    });

    return NextResponse.json({ 
      quiz, 
      alreadyPlayed: !!existingEnrollment,
      enrollment: existingEnrollment
    });
  } catch (error) {
    console.error("Daily Quiz GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
