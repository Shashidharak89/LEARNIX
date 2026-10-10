import { NextResponse } from "next/server";

const WORKER_URL = "https://store.achieve6227.workers.dev";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File exceeds 100 MB limit" }, { status: 413 });
    }

    const workerFormData = new FormData();
    workerFormData.append("file", file, file.name);
    workerFormData.append("listed", formData.get("listed") === "0" ? "0" : "1");

    const workerRes = await fetch(`${WORKER_URL}/api/upload`, {
      method: "POST",
      body: workerFormData,
    });

    const data = await workerRes.json();
    return NextResponse.json(data, { status: workerRes.status });
  } catch (err) {
    console.error("Upload-plus proxy error:", err);
    return NextResponse.json({ success: false, error: err.message || "Upload failed" }, { status: 500 });
  }
}
