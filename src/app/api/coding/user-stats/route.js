import { NextResponse } from "next/server";
import { docClient, SUBMISSIONS_TABLE, PROBLEMS_TABLE } from "@/lib/dynamodb";
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const authResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!authResult?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required to view coding stats.",
          requiresLogin: true,
        },
        { status: 401 }
      );
    }

    const authUser = authResult.user;
    const { searchParams } = new URL(req.url);
    const targetUsn = searchParams.get("usn");
    const targetUserId = searchParams.get("userId");

    let userId = String(authUser._id || authUser.id);

    // If another user's stats requested by USN
    if (targetUsn && targetUsn.toUpperCase() !== String(authUser.usn || "").toUpperCase()) {
      const foundUser = await User.findOne({ usn: targetUsn.toUpperCase() }).select("_id usn").lean();
      if (foundUser) {
        userId = String(foundUser._id);
      }
    } else if (targetUserId && targetUserId !== userId) {
      userId = targetUserId;
    }

    // 1. Fetch all problems from DynamoDB to calculate totals by difficulty
    const problemsRes = await docClient.send(
      new ScanCommand({
        TableName: PROBLEMS_TABLE,
        ProjectionExpression: "problemId, difficulty, #ord, title",
        ExpressionAttributeNames: { "#ord": "order" },
      })
    );
    const problems = problemsRes.Items || [];

    const problemMap = {};
    let easyTotal = 0;
    let mediumTotal = 0;
    let hardTotal = 0;

    for (const p of problems) {
      const diff = (p.difficulty || "Easy").trim();
      const normDiff =
        diff.toLowerCase() === "medium" || diff.toLowerCase() === "med."
          ? "Medium"
          : diff.toLowerCase() === "hard"
          ? "Hard"
          : "Easy";

      problemMap[p.problemId] = {
        difficulty: normDiff,
        title: p.title || p.problemId,
      };

      if (normDiff === "Easy") easyTotal++;
      else if (normDiff === "Medium") mediumTotal++;
      else if (normDiff === "Hard") hardTotal++;
    }

    const totalProblems = problems.length || 10;

    // 2. Fetch all submissions for the user from DynamoDB
    const submissionsRes = await docClient.send(
      new QueryCommand({
        TableName: SUBMISSIONS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
        ScanIndexForward: true, // chronological order
      })
    );
    const submissions = submissionsRes.Items || [];

    // 3. Process Submissions for Solved vs Attempting
    const solvedSet = new Set();
    const attemptedSet = new Set();
    let qualifyingCount = 0;

    // Calendar map: { "YYYY-MM-DD": count }
    const calendarMap = {};

    for (const sub of submissions) {
      const pid = sub.problemId;
      const isPassed = sub.status === "Accepted";
      const hasPartial = (sub.passedTestCases && sub.passedTestCases > 0);

      // Acceptance calculation: fully passed or partially passed submissions
      if (isPassed || hasPartial) {
        qualifyingCount++;
      }

      // Problem solved vs attempted
      if (isPassed) {
        solvedSet.add(pid);
        attemptedSet.delete(pid);
      } else {
        if (!solvedSet.has(pid)) {
          attemptedSet.add(pid);
        }
      }

      // Date mapping for heatmap
      if (sub.submittedAt) {
        try {
          const dateObj = new Date(sub.submittedAt);
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
            calendarMap[dateStr] = (calendarMap[dateStr] || 0) + 1;
          }
        } catch {
          // ignore date parse error
        }
      }
    }

    // Solved breakdown by difficulty
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const pid of solvedSet) {
      const pInfo = problemMap[pid];
      const diff = pInfo ? pInfo.difficulty : "Easy";
      if (diff === "Easy") easySolved++;
      else if (diff === "Medium") mediumSolved++;
      else if (diff === "Hard") hardSolved++;
    }

    const solvedCount = solvedSet.size;
    const attemptingCount = attemptedSet.size;
    const totalSubmissions = submissions.length;

    const acceptanceRate =
      totalSubmissions > 0
        ? ((qualifyingCount / totalSubmissions) * 100).toFixed(2)
        : "0.00";

    // 4. Calculate Past 365 Days Heatmap metrics, active days, streaks
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let totalActiveDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let annualSubmissions = 0;

    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 364);
    oneYearAgo.setHours(0, 0, 0, 0);

    let tempStreak = 0;
    const dayCursor = new Date(oneYearAgo);

    while (dayCursor <= today) {
      const dStr = dayCursor.toISOString().split("T")[0];
      const count = calendarMap[dStr] || 0;

      if (count > 0) {
        totalActiveDays++;
        annualSubmissions += count;
        tempStreak++;
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    // Calculate current streak leading up to today
    const checkCursor = new Date(today);
    while (checkCursor >= oneYearAgo) {
      const dStr = checkCursor.toISOString().split("T")[0];
      const count = calendarMap[dStr] || 0;
      if (count > 0) {
        currentStreak++;
        checkCursor.setDate(checkCursor.getDate() - 1);
      } else {
        // If today has 0, check yesterday
        if (checkCursor.toDateString() === today.toDateString()) {
          checkCursor.setDate(checkCursor.getDate() - 1);
          const yStr = checkCursor.toISOString().split("T")[0];
          if ((calendarMap[yStr] || 0) > 0) {
            continue;
          }
        }
        break;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProblems,
        solvedCount,
        attemptingCount,
        totalSubmissions,
        acceptanceRate,
        easy: {
          solved: easySolved,
          total: easyTotal || 1,
        },
        medium: {
          solved: mediumSolved,
          total: mediumTotal || 1,
        },
        hard: {
          solved: hardSolved,
          total: hardTotal || 1,
        },
        annualSubmissions,
        totalActiveDays,
        maxStreak,
        currentStreak,
        calendar: calendarMap,
      },
    });
  } catch (err) {
    console.error("Error fetching user coding stats:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load coding stats",
      },
      { status: 500 }
    );
  }
}
