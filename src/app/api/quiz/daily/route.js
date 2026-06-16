import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyQuiz from "@/models/DailyQuiz";
import DailyQuizEnrollment from "@/models/DailyQuizEnrollment";
import { resolveAuthenticatedUser } from "@/lib/authUser";

const CATEGORY_MAP = {
  "random": "",
  "general": "&category=9",
  "books": "&category=10",
  "film": "&category=11",
  "music": "&category=12",
  "videogames": "&category=15",
  "science": "&category=17",
  "computers": "&category=18",
  "math": "&category=19",
  "sports": "&category=21",
  "geography": "&category=22",
  "history": "&category=23",
  "art": "&category=25",
  "animals": "&category=27"
};

export async function GET(req) {
  try {
    await connectDB();
    const userResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!userResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let category = searchParams.get('category') || searchParams.get('topic') || 'random';
    category = category.toLowerCase();

    // Map to supported categories or fallback to random
    if (!CATEGORY_MAP.hasOwnProperty(category)) {
      category = 'random';
    }

    // Determine the current date string (YYYY-MM-DD)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    let quiz = await DailyQuiz.findOne({ dateStr, category });

    if (!quiz) {
      // First user of the day triggers fetching 5 random questions for this category
      let apiUrl = `https://opentdb.com/api.php?amount=5${CATEGORY_MAP[category]}`;

      const res = await fetch(apiUrl);
      const data = await res.json();
      
      if (data.response_code === 0 && data.results.length > 0) {
        // Save the questions to DB
        try {
            quiz = await DailyQuiz.create({
                dateStr,
                category,
                questions: data.results
            });
        } catch (e) {
            // In case of a race condition, try to fetch the newly created one
            quiz = await DailyQuiz.findOne({ dateStr, category });
            if (!quiz) throw e;
        }
      } else {
        return NextResponse.json({ error: "Failed to fetch questions from deck API" }, { status: 500 });
      }
    }

    // Check if user already participated today in this category
    const existingEnrollment = await DailyQuizEnrollment.findOne({ 
      userId: userResult.user._id, 
      dateStr,
      category
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
