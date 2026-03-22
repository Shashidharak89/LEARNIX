import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IPLogs from "@/models/IPLogs";

export const runtime = "nodejs";

function normalizeIp(value) {
  if (!value || typeof value !== "string") return "";
  const first = value.split(",")[0]?.trim() || "";
  if (first.startsWith("::ffff:")) return first.slice(7);
  return first;
}

function buildIPInfoUrl(ip) {
  const token = process.env.IPINFO_TOKEN || "";
  const tokenPart = token ? `?token=${encodeURIComponent(token)}` : "";
  if (!ip || ip === "unknown") {
    return `https://ipinfo.io/json${tokenPart}`;
  }
  return `https://ipinfo.io/${encodeURIComponent(ip)}/json${tokenPart}`;
}

export const POST = async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const normalized = normalizeIp(body?.ip || "");
    const ip = normalized || "unknown";

    let lookup = {};
    try {
      const response = await fetch(buildIPInfoUrl(ip), {
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

    await connectDB();

    await IPLogs.create({
      ip: ip === "unknown" ? lookup?.ip || "unknown" : ip,
      version: lookup?.version || (lookup?.ip?.includes(":") ? "IPv6" : "IPv4"),
      city: lookup?.city || "",
      region: lookup?.region || "",
      country_name: lookup?.country_name || lookup?.country || "",
      org: lookup?.org || "",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("IP log ingestion failed:", err);
    return NextResponse.json({ error: "Failed to log IP" }, { status: 500 });
  }
};
