import { NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/adminAuth";
import { docClient, TOPICS_TABLE, PROBLEMS_TABLE } from "@/lib/dynamodb";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [topicsRes, problemsRes] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: TOPICS_TABLE })),
      docClient.send(
        new ScanCommand({
          TableName: PROBLEMS_TABLE,
          ProjectionExpression: "problemId, topicIds",
        })
      ),
    ]);

    const topics = topicsRes.Items || [];
    const problems = problemsRes.Items || [];

    // Count problems per topic
    const topicUsage = {};
    for (const p of problems) {
      if (Array.isArray(p.topicIds)) {
        for (const tid of p.topicIds) {
          topicUsage[tid] = (topicUsage[tid] || 0) + 1;
        }
      }
    }

    const enriched = topics.map((t) => ({
      ...t,
      problemsCount: topicUsage[t.topicId] || 0,
    }));

    enriched.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    return NextResponse.json({ success: true, topics: enriched });
  } catch (err) {
    console.error("Admin topics fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, topicId, description = "", order } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Topic name is required." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanId = (topicId || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!cleanId) {
      return NextResponse.json(
        { success: false, error: "A valid topicId or name is required." },
        { status: 400 }
      );
    }

    // Determine order
    let assignedOrder = Number(order);
    if (isNaN(assignedOrder) || assignedOrder <= 0) {
      const scanRes = await docClient.send(
        new ScanCommand({
          TableName: TOPICS_TABLE,
          ProjectionExpression: "#ord",
          ExpressionAttributeNames: { "#ord": "order" },
        })
      );
      const maxOrd = (scanRes.Items || []).reduce(
        (max, item) => Math.max(max, Number(item.order) || 0),
        0
      );
      assignedOrder = maxOrd + 1;
    }

    const now = new Date().toISOString();
    const newTopic = {
      topicId: cleanId,
      name: cleanName,
      description: description.trim(),
      order: assignedOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TOPICS_TABLE,
        Item: newTopic,
      })
    );

    return NextResponse.json({
      success: true,
      topic: newTopic,
      message: `Topic "${cleanName}" (${cleanId}) created successfully!`,
    });
  } catch (err) {
    console.error("Admin topic create error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create topic: " + err.message },
      { status: 500 }
    );
  }
}
