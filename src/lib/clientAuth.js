function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function clearAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("usn");
  localStorage.removeItem("name");
  localStorage.removeItem("role");
  localStorage.removeItem("plan");
}

function syncAuthStorageFromUser(user, token = "") {
  if (typeof window === "undefined") return;
  if (!user || !user.usn) {
    clearAuthStorage();
    return;
  }

  if (token) {
    localStorage.setItem("token", token);
  }

  localStorage.setItem("usn", String(user.usn || "").toUpperCase());
  localStorage.setItem("name", String(user.name || ""));
  localStorage.setItem("role", String(user.role || "user"));
  localStorage.setItem("plan", String(user.plan || "basic"));

  window.dispatchEvent(
    new window.CustomEvent("learnix:auth-synced", {
      detail: {
        user: {
          usn: String(user.usn || "").toUpperCase(),
          name: String(user.name || ""),
          role: String(user.role || "user"),
          plan: String(user.plan || "basic"),
        },
      },
    })
  );
}

export async function verifyTokenAndSyncAuth({ redirectOnFailure = false } = {}) {
  if (typeof window === "undefined") return null;

  const token = getStoredToken();
  if (!token) {
    clearAuthStorage();
    return null;
  }

  try {
    const response = await fetch("/api/auth/verify-token", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.user) {
      clearAuthStorage();
      if (redirectOnFailure && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return null;
    }

    syncAuthStorageFromUser(data.user, token);
    return data.user;
  } catch {
    return null;
  }
}

export function syncAuthStateFromLoginResponse(payload) {
  if (typeof window === "undefined") return;
  const token = String(payload?.token || "").trim();
  const user = payload?.user || null;
  syncAuthStorageFromUser(user, token);
}

export function signOutFromBrowser(reason = "Session expired. Please login again.") {
  if (typeof window === "undefined") return;

  clearAuthStorage();

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
