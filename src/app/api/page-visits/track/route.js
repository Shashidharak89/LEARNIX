import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { docClient, PAGE_VISITS_TABLE } from "@/lib/dynamodb";
import { getLearnixDateId, normalizePageUrl } from "@/lib/pageVisits";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const origin = req.headers.get("origin");
    const requestHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
    if (origin && new URL(origin).host !== requestHost) {
      return NextResponse.json({ error: "Cross-origin tracking requests are not allowed." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (typeof body?.pageurl !== "string" || !body.pageurl.trim() || body.pageurl.length > 500) {
      return NextResponse.json({ error: "A valid page URL is required." }, { status: 400 });
    }
    const pageurl = normalizePageUrl(body?.pageurl);
    if (pageurl === "/api" || pageurl.startsWith("/api/")) {
      return NextResponse.json({ error: "API routes are not tracked as page visits." }, { status: 400 });
    }

    const now = Date.now();
    const id = getLearnixDateId(new Date(now));

    // Optimistic version updates keep the single daily visits array accurate under concurrent hits.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const result = await docClient.send(new GetCommand({
        TableName: PAGE_VISITS_TABLE,
        Key: { id },
        ConsistentRead: true,
      }));
      const record = result.Item;

      if (!record) {
        try {
          await docClient.send(new PutCommand({
            TableName: PAGE_VISITS_TABLE,
            Item: {
              id,
              timestamp: now,
              updatedAt: now,
              version: 1,
              visits: [{ pageurl, count: 1 }],
            },
            ConditionExpression: "attribute_not_exists(id)",
          }));
          return NextResponse.json({ success: true, date: id, pageurl });
        } catch (error) {
          if (error?.name === "ConditionalCheckFailedException") continue;
          throw error;
        }
      }

      const visits = Array.isArray(record.visits) ? record.visits : [];
      const existingIndex = visits.findIndex((visit) => visit.pageurl === pageurl);
      const nextVisits = visits.map((visit, index) => (
        index === existingIndex ? { ...visit, count: Number(visit.count || 0) + 1 } : visit
      ));
      if (existingIndex < 0) nextVisits.push({ pageurl, count: 1 });

      const version = Number(record.version);
      const hasVersion = Number.isInteger(version) && version > 0;
      try {
        await docClient.send(new UpdateCommand({
          TableName: PAGE_VISITS_TABLE,
          Key: { id },
          UpdateExpression: "SET #visits = :visits, #timestamp = :timestamp, #updatedAt = :updatedAt, #version = :nextVersion",
          ConditionExpression: hasVersion
            ? "#version = :expectedVersion"
            : "attribute_exists(id) AND attribute_not_exists(#version)",
          ExpressionAttributeNames: {
            "#visits": "visits",
            "#timestamp": "timestamp",
            "#updatedAt": "updatedAt",
            "#version": "version",
          },
          ExpressionAttributeValues: {
            ":visits": nextVisits,
            ":timestamp": now,
            ":updatedAt": now,
            ":nextVersion": hasVersion ? version + 1 : 1,
            ...(hasVersion ? { ":expectedVersion": version } : {}),
          },
        }));
        return NextResponse.json({ success: true, date: id, pageurl });
      } catch (error) {
        if (error?.name === "ConditionalCheckFailedException") continue;
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not record the page visit. Please retry." }, { status: 503 });
  } catch (error) {
    console.error("POST /api/page-visits/track error:", error);
    return NextResponse.json({ error: "Failed to record page visit." }, { status: 500 });
  }
}
