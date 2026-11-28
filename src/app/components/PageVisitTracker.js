"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageVisitTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current || pathname === "/api" || pathname.startsWith("/api/")) return;
    lastTrackedPath.current = pathname;

    fetch("/api/page-visits/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageurl: pathname }),
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }, [pathname]);

  return null;
}
