import { authFetch } from "@/lib/clientAuth";

/**
 * Toggle an item in Learn Later
 * @param {Object} item { type, targetId, title, subtitle, description, url, thumbnail, metadata }
 */
export async function toggleLearnLaterClient(item) {
  if (typeof window === "undefined") return { success: false };

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return { success: false, requiresLogin: true };
  }

  try {
    const res = await authFetch("/api/learn-later", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", ...item }),
    });

    const data = await res.json();
    if (data.success) {
      window.dispatchEvent(
        new window.CustomEvent("learnix:learn-later-updated", {
          detail: { itemId: data.itemId, isSaved: data.isSaved, item },
        })
      );
    }
    return data;
  } catch (err) {
    console.error("Error toggling Learn Later:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove an item by itemId
 */
export async function removeLearnLaterClient(itemId) {
  if (typeof window === "undefined" || !itemId) return { success: false };

  try {
    const res = await authFetch(`/api/learn-later/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      window.dispatchEvent(
        new window.CustomEvent("learnix:learn-later-updated", {
          detail: { itemId, isSaved: false },
        })
      );
    }
    return data;
  } catch (err) {
    console.error("Error removing Learn Later:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Bulk check saved status of items
 */
export async function checkLearnLaterStatusClient(items) {
  if (typeof window === "undefined" || !Array.isArray(items) || items.length === 0) {
    return {};
  }

  const token = localStorage.getItem("token");
  if (!token) return {};

  try {
    const res = await authFetch("/api/learn-later/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    return data.savedMap || {};
  } catch (err) {
    console.error("Error checking Learn Later status:", err);
    return {};
  }
}
