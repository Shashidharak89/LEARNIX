import { NextResponse } from "next/server";
import { docClient, SUBMISSIONS_TABLE } from "@/lib/dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const authResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!authResult?.user) {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
        statusMap: {},
        solvedCount: 0,
        attemptingCount: 0,
      });
    }

    const authUser = authResult.user;
    const userId = String(authUser._id || authUser.id);

    // Fetch all submissions for the user
    const submissionsRes = await docClient.send(
      new QueryCommand({
        TableName: SUBMISSIONS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      })
    );

    let submissions = submissionsRes.Items || [];

    // Fallback if submissions might be keyed under user's USN
    if (authUser.usn && authUser.usn !== userId) {
      try {
        const usnSubRes = await docClient.send(
          new QueryCommand({
            TableName: SUBMISSIONS_TABLE,
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
              ":uid": String(authUser.usn),
            },
          })
        );
        if (usnSubRes.Items && usnSubRes.Items.length > 0) {
          const seen = new Set(submissions.map((s) => s.submissionId));
          for (const s of usnSubRes.Items) {
            if (!seen.has(s.submissionId)) {
              submissions.push(s);
            }
          }
        }
      } catch {
        // ignore fallback errors
      }
    }

    const solvedSet = new Set();
    const attemptedSet = new Set();
    const statusMap = {};

    for (const sub of submissions) {
      const pid = sub.problemId ? String(sub.problemId) : "";
      const pOrder =
        sub.problemOrder !== undefined && sub.problemOrder !== null
          ? String(sub.problemOrder)
          : "";

      const isPassed =
        sub.status === "Accepted" ||
        (Number(sub.totalTestCases) > 0 &&
          Number(sub.passedTestCases) === Number(sub.totalTestCases));

      if (isPassed) {
        if (pid) {
          solvedSet.add(pid);
          attemptedSet.delete(pid);
        }
        if (pOrder) {
          solvedSet.add(pOrder);
          attemptedSet.delete(pOrder);
        }
      } else {
        if (pid && !solvedSet.has(pid)) {
          attemptedSet.add(pid);
        }
        if (pOrder && !solvedSet.has(pOrder)) {
          attemptedSet.add(pOrder);
        }
      }
    }

    for (const id of solvedSet) {
      statusMap[id] = "solved";
    }
    for (const id of attemptedSet) {
      if (!statusMap[id]) {
        statusMap[id] = "attempting";
      }
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      statusMap,
      solvedCount: solvedSet.size,
      attemptingCount: attemptedSet.size,
    });
  } catch (err) {
    console.error("Error fetching user coding status:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load coding status",
        statusMap: {},
      },
      { status: 500 }
    );
  }
}
