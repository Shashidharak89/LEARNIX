import { NextResponse } from "next/server";
import { docClient, TOPICS_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await docClient.send(
      new ScanCommand({
        TableName: TOPICS_TABLE,
      })
    );

    const topics = res.Items || [];
    topics.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (err) {
    console.error("Coding topics fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
