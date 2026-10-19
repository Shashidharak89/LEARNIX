import { NextResponse } from "next/server";
import { docClient, SUBMISSIONS_TABLE, PROBLEMS_TABLE } from "@/lib/dynamodb";
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const authResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!authResult?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Please log in to view your submissions.",
          requiresLogin: true,
          submissions: [],
        },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const userId = String(user._id || user.id);

    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");

    let resolvedProblemId = problemId;

    // If problemId is numeric order, resolve to problem's actual problemId
    if (problemId) {
      const numId = parseInt(problemId, 10);
      if (!isNaN(numId)) {
        const orderRes = await docClient.send(
          new ScanCommand({
            TableName: PROBLEMS_TABLE,
            FilterExpression: "#ord = :numId",
            ExpressionAttributeNames: { "#ord": "order" },
            ExpressionAttributeValues: { ":numId": numId },
          })
        );
        if (orderRes.Items && orderRes.Items.length > 0) {
          resolvedProblemId = orderRes.Items[0].problemId;
        }
      }
    }

    const queryParams = {
      TableName: SUBMISSIONS_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
      ScanIndexForward: false, // Newest first
    };

    if (resolvedProblemId) {
      queryParams.FilterExpression = "problemId = :pid";
      queryParams.ExpressionAttributeValues[":pid"] = resolvedProblemId;
    }

    const res = await docClient.send(new QueryCommand(queryParams));
    const submissions = res.Items || [];

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch submissions", submissions: [] },
      { status: 500 }
    );
  }
}
