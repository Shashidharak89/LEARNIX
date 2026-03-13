function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export function signOutFromBrowser(reason = "Session expired. Please login again.") {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("usn");
  localStorage.removeItem("name");
  localStorage.removeItem("role");

  window.dispatchEvent(
    new window.CustomEvent("learnix:auth-expired", { detail: { reason } })
  );

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function shouldForceSignOut(response) {
  const token = getStoredToken();
  if (!token) return false;

  const statusSuggestsAuth = response.status === 401 || response.status === 403;
  let errorText = "";

  try {
    const cloned = response.clone();
    const contentType = cloned.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await cloned.json();
      errorText = String(body?.error || body?.message || "");
    } else {
      errorText = await cloned.text();
    }
  } catch {
    errorText = "";
  }

  const looksExpired = /token.*expired|expired.*token|jwt.*expired/i.test(errorText);
  const looksInvalid = /invalid token|token invalid|authentication failed|unauthorized/i.test(errorText);

  return statusSuggestsAuth && (looksExpired || looksInvalid);
}

export async function authFetch(input, init = {}) {
  const headers = new window.Headers(init.headers || {});
  const token = getStoredToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (await shouldForceSignOut(response)) {
    signOutFromBrowser("Your session expired. Please login again.");
  }

  return response;
}
