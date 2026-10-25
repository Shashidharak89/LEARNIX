import { NextResponse } from "next/server";
import { docClient, PROBLEMS_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, parseInt(searchParams.get("size") || "20", 10));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const difficulty = (searchParams.get("difficulty") || "all").trim();

    const res = await docClient.send(
      new ScanCommand({
        TableName: PROBLEMS_TABLE,
        ProjectionExpression: "problemId, slug, title, difficulty, tags, topicIds, #ord, isActive",
        ExpressionAttributeNames: {
          "#ord": "order",
        },
      })
    );

    let items = (res.Items || []).filter((item) => item.isActive !== false);

    // Filter by difficulty
    if (difficulty && difficulty !== "all") {
      items = items.filter(
        (p) => p.difficulty && p.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Filter by search
    if (search) {
      items = items.filter((p) => {
        const matchesTitle = p.title && p.title.toLowerCase().includes(search);
        const matchesSlug = p.slug && p.slug.toLowerCase().includes(search);
        const matchesTags = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(search));
        const matchesTopics = Array.isArray(p.topicIds) && p.topicIds.some((tid) => tid.toLowerCase().includes(search));
        const matchesOrder = String(p.order || "").includes(search);
        return matchesTitle || matchesSlug || matchesTags || matchesTopics || matchesOrder;
      });
    }

    items.sort((a, b) => (a.order || 999) - (b.order || 999));

    const total = items.length;
    const totalPages = Math.ceil(total / size);
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const sliced = items.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    return NextResponse.json({
      success: true,
      problems: sliced,
      page,
      size,
      total,
      totalPages,
      hasMore,
    });
  } catch (err) {
    console.error("Failed to list coding problems:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve coding problems" },
      { status: 500 }
    );
  }
}

