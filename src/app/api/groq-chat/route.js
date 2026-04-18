import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const PRO_ONLY_FEATURES = new Set(["works-image-analyze", "works-topic-summarize"]);

export async function POST(req) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const question = String(body?.question || "").trim();
    const feature = String(body?.feature || "").trim().toLowerCase();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (PRO_ONLY_FEATURES.has(feature)) {
      await connectDB();
      const auth = await resolveAuthenticatedUser(req, { withMeta: true });

      if (auth.tokenProvided && auth.tokenInvalid) {
        return NextResponse.json(
          { error: "Token expired or invalid. Please login again." },
          { status: 401 }
        );
      }

      if (!auth.user) {
        return NextResponse.json(
          { error: "Login required for this feature." },
          { status: 401 }
        );
      }

      const plan = String(auth.user?.plan || "basic").toLowerCase();
      if (plan !== "pro") {
        return NextResponse.json(
          { error: "This AI feature is available for Pro users only." },
          { status: 403 }
        );
      }
    }

    const upstreamRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are Learnix assistant. Answer clearly and briefly for students. If unsure, say you are unsure.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.5,
      }),
      cache: "no-store",
    });

    const data = await upstreamRes.json();

    if (!upstreamRes.ok) {
      const upstreamError =
        data?.error?.message || data?.message || "Groq API request failed";

      return NextResponse.json({ error: upstreamError }, { status: upstreamRes.status });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "No answer returned from Groq" },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("POST /api/groq-chat error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
