import { NextResponse } from "next/server";

function extractIp(request) {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-client-ip"),
  ];

  for (const value of candidates) {
    if (!value) continue;
    const first = value.split(",")[0]?.trim();
    if (!first) continue;
    if (first.startsWith("::ffff:")) return first.slice(7);
    return first;
  }

  return "";
}

export function middleware(request, event) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/ipinfo-log") || pathname.startsWith("/api/internal/ip-logs")) {
    return NextResponse.next();
  }

  const ip = extractIp(request);

  const ingestUrl = new URL("/api/ipinfo-log", request.url);
  const payload = { ip: ip || "unknown" };

  event.waitUntil(
    fetch(ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }).catch(() => null)
  );

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
