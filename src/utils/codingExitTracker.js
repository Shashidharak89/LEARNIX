/* global sessionStorage */

/**
 * Helper to record the non-coding origin URL when entering the Learnix Code section
 * and reliably exit the entire coding section back to that original page.
 */

export function recordCodingEntry() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return;

  const currentPath = window.location.pathname;
  if (currentPath.startsWith("/learnix-code") || currentPath.startsWith("/test")) {
    // If we already have a saved target that is outside of coding, keep it
    const existing = sessionStorage.getItem("learnix_code_entry_point");
    if (existing && !existing.startsWith("/learnix-code") && !existing.startsWith("/test")) {
      return;
    }

    // Try reading document.referrer if it belongs to this host
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    if (referrer && referrer.includes(window.location.host)) {
      try {
        const refUrl = new URL(referrer);
        if (!refUrl.pathname.startsWith("/learnix-code") && !refUrl.pathname.startsWith("/test")) {
          sessionStorage.setItem("learnix_code_entry_point", refUrl.pathname + refUrl.search);
          return;
        }
      } catch {
        // fallback below
      }
    }

    // Default entry fallback if visited directly or from external
    if (!existing) {
      sessionStorage.setItem("learnix_code_entry_point", "/");
    }
  } else {
    // We are on a normal Learnix page (e.g. /, /dashboard, /qp, /works)
    sessionStorage.setItem("learnix_code_entry_point", currentPath + window.location.search);
  }
}

export function exitCodingEnvironment(router) {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    if (router) router.push("/");
    return;
  }

  const exitTarget = sessionStorage.getItem("learnix_code_entry_point") || "/";
  // Clear the saved entry so next time is fresh
  sessionStorage.removeItem("learnix_code_entry_point");

  if (router) {
    router.push(exitTarget);
  } else {
    window.location.href = exitTarget;
  }
}
