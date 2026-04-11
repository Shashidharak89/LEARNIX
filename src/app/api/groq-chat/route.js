import { NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

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

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
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
