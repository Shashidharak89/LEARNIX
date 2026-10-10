import { NextResponse } from "next/server";

const WORKER_URL = "https://store.achieve6227.workers.dev";

export async function GET(req, { params }) {
  try {
    const { code } = await params;
    const cleanCode = String(code || "").trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const res = await fetch(`${WORKER_URL}/api/download/${encodeURIComponent(cleanCode)}`);
    if (!res.ok) {
      return NextResponse.json({ error: "File not found or expired" }, { status: res.status });
    }

    const headers = new Headers();
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = res.headers.get("content-disposition") || `attachment; filename="${cleanCode}"`;
    headers.set("content-type", contentType);
    headers.set("content-disposition", contentDisposition);

    return new Response(res.body, { headers });
  } catch (err) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
