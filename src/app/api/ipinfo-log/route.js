import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IPLogs from "@/models/IPLogs";

export const runtime = "nodejs";

function normalizeIp(value) {
  if (!value || typeof value !== "string") return "";
  const first = value.split(",")[0]?.trim() || "";
  return first.startsWith("::ffff:") ? first.slice(7) : first;
}

function extractIpFromHeaders(req) {
  const headers = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-client-ip"),
  ];

  for (const value of headers) {
    const parsed = normalizeIp(value || "");
    if (parsed) return parsed;
  }

  return "";
}

function inferVersion(ip) {
  if (!ip) return "";
  return ip.includes(":") ? "IPv6" : "IPv4";
}

function buildIpinfoUrl() {
  const token = process.env.IPINFO_TOKEN || "";
  return token
    ? `https://ipinfo.io/json?token=${encodeURIComponent(token)}`
    : "https://ipinfo.io/json";
}

export const POST = async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const bodyIp = normalizeIp(body?.ip || "");
    const headerIp = extractIpFromHeaders(req);

    let ipinfo = {};
    try {
      const response = await fetch(buildIpinfoUrl(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        ipinfo = await response.json();
      }
    } catch {
      ipinfo = {};
    }

    const finalIp = normalizeIp(ipinfo?.ip || bodyIp || headerIp || "unknown");

    await connectDB();

    const created = await IPLogs.create({
      ip: finalIp || "unknown",
      network: ipinfo?.network || "",
      version: ipinfo?.version || inferVersion(finalIp),
      city: ipinfo?.city || "",
      region: ipinfo?.region || "",
      country_name: ipinfo?.country_name || ipinfo?.country || "",
      org: ipinfo?.org || "",
    });

    return NextResponse.json(
      {
        success: true,
        record: {
          _id: created._id,
          ip: created.ip,
          network: created.network,
          version: created.version,
          city: created.city,
          region: created.region,
          country_name: created.country_name,
          org: created.org,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("ipinfo log API failed:", err);
    return NextResponse.json({ error: "Failed to create IP log" }, { status: 500 });
  }
};
