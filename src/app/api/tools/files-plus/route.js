import { NextResponse } from "next/server";

const WORKER_URL = "https://store.achieve6227.workers.dev";

export async function GET() {
  try {
    const res = await fetch(`${WORKER_URL}/api/files`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ success: false, files: [], error: err.message }, { status: 500 });
  }
}
