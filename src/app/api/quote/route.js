import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import RequestMetric from "@/models/RequestMetric";

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

    // -------------------------
    // Metric tracking (safe)
    // -------------------------
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to start of day

      await RequestMetric.findOneAndUpdate(
        { datetime: today },
        { $inc: { quote: 1 } },
        { upsert: true, new: true }
      );
    } catch (metricError) {
      console.error("Metric update failed:", metricError.message);
      // Do nothing → main API continues working
    }
    // -------------------------

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