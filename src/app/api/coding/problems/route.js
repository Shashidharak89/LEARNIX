import { NextResponse } from "next/server";
import { docClient, PROBLEMS_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await docClient.send(
      new ScanCommand({
        TableName: PROBLEMS_TABLE,
        ProjectionExpression: "problemId, slug, title, difficulty, tags, #ord, isActive",
        ExpressionAttributeNames: {
          "#ord": "order",
        },
      })
    );

    const items = (res.Items || [])
      .filter((item) => item.isActive !== false)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return NextResponse.json({
      success: true,
      problems: items,
    });
  } catch (err) {
    console.error("Failed to list coding problems:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve coding problems" },
      { status: 500 }
    );
  }
}
