import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import RequestMetric from "@/models/RequestMetric";

function extractIpFromReq(req) {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-client-ip"),
  ];

  for (const value of candidates) {
    if (!value) continue;
    const first = value.split(",")[0]?.trim() || "";
    if (!first) continue;
    return first.startsWith("::ffff:") ? first.slice(7) : first;
  }

  return "";
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    const res = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const [data] = await res.json();

    try {
      const origin = new URL(req.url).origin;
      const ip = extractIpFromReq(req);
      await fetch(`${origin}/api/ipinfo-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
        cache: "no-store",
      });
    } catch (err) {
      console.error("IP info logging failed:", err?.message || err);
    }

    // METRIC TRACKING
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await RequestMetric.findOneAndUpdate(
        { datetime: today },
        { $inc: { quote: 1 } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Metric update failed:", err.message);
    }

    return NextResponse.json({
      content: data.q,
      author: data.a,
    });

  } catch {
    return NextResponse.json(
      { error: "Failed to reach quote API" },
      { status: 502 }
    );
  }
}