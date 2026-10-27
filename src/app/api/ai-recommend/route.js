import { NextResponse } from "next/server";

const RECOMMEND_API_URL = "https://shashidharak99-learnix-ai-api.hf.space/recommend";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawQuery = body?.query || "";
    const cleanQuery = typeof rawQuery === "string" ? rawQuery.trim() : "";
    const limit = typeof body?.limit === "number" ? body.limit : 10;

    if (!cleanQuery) {
      return NextResponse.json({ query: "", count: 0, results: [] });
    }

    let signal;
    let timeoutId;
    if (typeof globalThis !== "undefined" && globalThis.AbortController) {
      const controller = new globalThis.AbortController();
      signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), 12000);
    }

    const upstreamRes = await fetch(RECOMMEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: cleanQuery,
        limit,
      }),
      signal,
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      console.error("AI recommend upstream error:", upstreamRes.status, errText);
      return NextResponse.json(
        { error: "Upstream recommendation service unavailable", results: [], count: 0 },
        { status: 502 }
      );
    }

    const data = await upstreamRes.json();

    // Clean up IDs if wrapped in extra quotes (e.g., "\"6a9707a...\"")
    const sanitizedResults = (data.results || []).map((item) => {
      let cleanId = item.resource_id;
      if (typeof cleanId === "string") {
        cleanId = cleanId.replace(/^["']|["']$/g, "").trim();
      }
      return {
        ...item,
        resource_id: cleanId,
      };
    });

    return NextResponse.json({
      query: data.query || cleanQuery,
      count: sanitizedResults.length,
      results: sanitizedResults,
    });
  } catch (error) {
    console.error("Error in AI recommendation proxy route:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI suggestions", results: [], count: 0 },
      { status: 500 }
    );
  }
}
