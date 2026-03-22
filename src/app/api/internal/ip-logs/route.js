import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IPLogs from "@/models/IPLogs";

function normalizeIp(value) {
  if (!value || typeof value !== "string") return "";
  const first = value.split(",")[0]?.trim() || "";
  if (first.startsWith("::ffff:")) return first.slice(7);
  return first;
}

function buildIPAPIUrl(ip) {
  return `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
}

export const POST = async (req) => {
  try {
    const sourceHeader = req.headers.get("x-ip-log-source") || "";
    if (sourceHeader !== "middleware-v1") {
      return NextResponse.json({ error: "Unauthorized source" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const normalized = normalizeIp(body?.ip || "");
    const ip = normalized || "unknown";

    let lookup = {};
    if (ip !== "unknown") {
      try {
        const response = await fetch(buildIPAPIUrl(ip), {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (response.ok) {
          lookup = await response.json();
        }
      } catch {
        lookup = {};
      }
    }

    await connectDB();

    await IPLogs.create({
      ip,
      network: lookup?.network || "",
      version: lookup?.version || "",
      city: lookup?.city || "",
      region: lookup?.region || "",
      country_name: lookup?.country_name || "",
      org: lookup?.org || "",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("IP log ingestion failed:", err);
    return NextResponse.json({ error: "Failed to log IP" }, { status: 500 });
  }
};
