import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { createKeepItem, listKeepItems } from "@/lib/keep";

export const dynamic = "force-dynamic";

async function getUser(req) {
  await connectDB();
  const auth = await resolveAuthenticatedUser(req, { withMeta: true });
  return auth?.user || null;
}

export async function GET(req) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Please sign in to access Keep." }, { status: 401 });
    const params = new URL(req.url).searchParams;
    const result = await listKeepItems(String(user._id || user.id || user.usn), {
      page: params.get("page"), size: params.get("size"), search: params.get("search") || "", type: params.get("type") || "all",
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/keep error:", error);
    return NextResponse.json({ error: "Could not load your Keep items." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Please sign in to access Keep." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (body.type === "link" && !/^https?:\/\//i.test(String(body.url || ""))) {
      return NextResponse.json({ error: "Enter a valid http or https link." }, { status: 400 });
    }
    if (body.type === "file" && !body.file?.publicId) return NextResponse.json({ error: "Upload a file first." }, { status: 400 });
    const item = await createKeepItem(String(user._id || user.id || user.usn), body);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/keep error:", error);
    return NextResponse.json({ error: "Could not save this item." }, { status: 500 });
  }
}
