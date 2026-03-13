import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";

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

    const [data] = await res.json(); // zenquotes returns an array
    return NextResponse.json({
      content: data.q,
      author:  data.a,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach quote API" },
      { status: 502 }
    );
  }
}
