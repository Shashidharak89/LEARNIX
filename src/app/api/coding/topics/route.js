import { NextResponse } from "next/server";
import { docClient, TOPICS_TABLE, PROBLEMS_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [topicsRes, problemsRes] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: TOPICS_TABLE })),
      docClient.send(
        new ScanCommand({
          TableName: PROBLEMS_TABLE,
          ProjectionExpression: "problemId, topicIds, tags, isActive",
        })
      ),
    ]);

    const topics = topicsRes.Items || [];
    const problems = (problemsRes.Items || []).filter((p) => p.isActive !== false);

    // Count problems per topic
    const topicUsage = {};
    for (const p of problems) {
      if (Array.isArray(p.topicIds)) {
        for (const tid of p.topicIds) {
          const norm = String(tid).toLowerCase();
          topicUsage[norm] = (topicUsage[norm] || 0) + 1;
        }
      }
      if (Array.isArray(p.tags)) {
        for (const tag of p.tags) {
          const norm = String(tag).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
          if (norm && !topicUsage[norm]) {
            topicUsage[norm] = (topicUsage[norm] || 0) + 1;
          }
        }
      }
    }

    const enriched = topics.map((t) => {
      const tid = String(t.topicId || "").toLowerCase();
      return {
        ...t,
        problemsCount: topicUsage[tid] || 0,
      };
    });

    enriched.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    return NextResponse.json({
      success: true,
      topics: enriched,
      count: enriched.length,
      totalProblems: problems.length,
    });
  } catch (err) {
    console.error("Coding topics fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
