import { authFetch } from "@/lib/clientAuth";

export const LEARN_LATER_STORAGE_KEY = "learnix_learn_later_items";

/**
 * Normalize category type
 */
export function normalizeLearnLaterType(type) {
  const t = String(type || "").toLowerCase().trim();
  if (t === "work" || t === "works" || t === "topic" || t === "resource" || t === "resources") {
    return "resource";
  }
  if (t === "update" || t === "updates") {
    return "update";
  }
  if (t === "sm" || t === "study-material" || t === "studymaterial" || t === "materials" || t === "material") {
    return "study-material";
  }
  if (t === "qp" || t === "question-paper" || t === "questionpaper" || t === "questionpapers") {
    return "question-paper";
  }
  return t || "resource";
}

/**
 * Build consistent client itemId
 */
export function buildClientItemId(type, targetId) {
  const norm = normalizeLearnLaterType(type);
  const cleanId = String(targetId || "").trim();
  return `${norm}#${cleanId}`;
}

/**
 * Retrieve saved Learn Later items from localStorage
 */
export function getSavedLearnLaterFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEARN_LATER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error reading Learn Later from localStorage:", e);
    return [];
  }
}

/**
 * Check if a specific item is in localStorage
 */
export function isItemInLearnLaterStorage(type, targetId) {
  if (typeof window === "undefined" || !targetId) return false;
  const items = getSavedLearnLaterFromStorage();
  const normType = type ? normalizeLearnLaterType(type) : null;
  const cleanTargetId = String(targetId).trim();
  const expectedHash = normType ? `${normType}#${cleanTargetId}` : null;
  const expectedColon = normType ? `${normType}:${cleanTargetId}` : null;

  return items.some((item) => {
    const itTarget = String(item.targetId || item.id || "").trim();
    const itType = normalizeLearnLaterType(item.type);
    const itItemId = String(item.itemId || item.id || "").trim();

    if (expectedHash && (itItemId === expectedHash || itItemId === expectedColon)) {
      return true;
    }
    if (itTarget === cleanTargetId) {
      if (!normType || itType === normType) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Save an item into localStorage
 */
export function saveItemToLearnLaterStorage(item) {
  if (typeof window === "undefined" || !item) return;
  try {
    const items = getSavedLearnLaterFromStorage();
    const normType = normalizeLearnLaterType(item.type);
    const cleanTargetId = String(item.targetId || item.id || "").trim();
    const itemId = item.itemId || `${normType}#${cleanTargetId}`;

    const exists = items.some((it) => {
      const itItemId = String(it.itemId || it.id || "").trim();
      const itTarget = String(it.targetId || it.id || "").trim();
      const itType = normalizeLearnLaterType(it.type);
      return itItemId === itemId || (itTarget === cleanTargetId && itType === normType);
    });

    if (!exists) {
      const newItem = {
        ...item,
        itemId,
        type: normType,
        targetId: cleanTargetId,
        createdAt: item.createdAt || new Date().toISOString(),
      };
      const updated = [newItem, ...items];
      localStorage.setItem(LEARN_LATER_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Error saving Learn Later to localStorage:", e);
  }
}

/**
 * Remove an item from localStorage
 */
export function removeItemFromLearnLaterStorage(type, targetId, itemId) {
  if (typeof window === "undefined") return;
  try {
    const items = getSavedLearnLaterFromStorage();
    const normType = type ? normalizeLearnLaterType(type) : null;
    const cleanTargetId = targetId ? String(targetId).trim() : null;
    const cleanItemId = itemId ? String(itemId).trim() : null;

    const updated = items.filter((it) => {
      const itItemId = String(it.itemId || it.id || "").trim();
      const itTarget = String(it.targetId || it.id || "").trim();
      const itType = normalizeLearnLaterType(it.type);

      if (cleanItemId && itItemId === cleanItemId) return false;
      if (cleanTargetId && normType && itTarget === cleanTargetId && itType === normType) return false;
      if (cleanTargetId && !normType && itTarget === cleanTargetId) return false;
      return true;
    });

    localStorage.setItem(LEARN_LATER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error removing Learn Later from localStorage:", e);
  }
}

/**
 * Synchronize localStorage with server items
 * Updates directly if items < 20 (including when empty / cleared)
 */
export function syncLearnLaterToStorage(serverItems) {
  if (typeof window === "undefined") return;
  try {
    if (!Array.isArray(serverItems)) {
      if (serverItems === null || serverItems === undefined) {
        localStorage.setItem(LEARN_LATER_STORAGE_KEY, JSON.stringify([]));
      }
      return;
    }

    if (serverItems.length < 20) {
      localStorage.setItem(LEARN_LATER_STORAGE_KEY, JSON.stringify(serverItems));
    }
  } catch (e) {
    console.error("Error syncing Learn Later to localStorage:", e);
  }
}

/**
 * Floating bottom-right popup toast for Learn Later actions
 */
export function showLearnLaterToast(message = "Saved to Learn Later", type = "success") {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  let container = document.getElementById("learnix-ll-toast-portal");
  if (!container) {
    container = document.createElement("div");
    container.id = "learnix-ll-toast-portal";
    container.setAttribute("aria-live", "polite");
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "learnix-ll-toast-item";
  toast.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 9999px;
    box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
    font-size: 0.88rem;
    font-weight: 600;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    letter-spacing: -0.01em;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(18px) scale(0.96);
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.12);
  `;

  const iconSvg = type === "removed"
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="#8b5cf6" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0) scale(1)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px) scale(0.96)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

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
      const isSaved = Boolean(data.isSaved);
      const itemId = data.itemId || buildClientItemId(item.type, item.targetId || item.id);

      if (isSaved) {
        saveItemToLearnLaterStorage({
          ...item,
          itemId,
          createdAt: data.item?.createdAt || new Date().toISOString(),
        });
        showLearnLaterToast("Saved to Learn Later", "success");
      } else {
        removeItemFromLearnLaterStorage(item.type, item.targetId || item.id, itemId);
        showLearnLaterToast("Removed from Learn Later", "removed");
      }

      window.dispatchEvent(
        new window.CustomEvent("learnix:learn-later-updated", {
          detail: { itemId, isSaved, item: { ...item, itemId } },
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
export async function removeLearnLaterClient(itemId, type, targetId) {
  if (typeof window === "undefined" || !itemId) return { success: false };

  try {
    const res = await authFetch(`/api/learn-later/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      removeItemFromLearnLaterStorage(type, targetId, itemId);
      showLearnLaterToast("Removed from Learn Later", "removed");
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
 * Bulk check saved status of items with localStorage fallback
 */
export async function checkLearnLaterStatusClient(items) {
  if (typeof window === "undefined" || !Array.isArray(items) || items.length === 0) {
    return {};
  }

  const savedMap = {};
  for (const it of items) {
    const type = it.type;
    const targetId = it.targetId || it.id;
    if (targetId) {
      const norm = normalizeLearnLaterType(type);
      const hashKey = `${norm}#${targetId}`;
      const colonKey = `${norm}:${targetId}`;
      const isSaved = isItemInLearnLaterStorage(type, targetId);
      if (isSaved) {
        savedMap[hashKey] = true;
        savedMap[colonKey] = true;
        savedMap[targetId] = true;
      }
    }
  }

  const token = localStorage.getItem("token");
  if (!token) return savedMap;

  try {
    const res = await authFetch("/api/learn-later/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (data.savedMap) {
      for (const [key, val] of Object.entries(data.savedMap)) {
        savedMap[key] = val;
        if (key.includes("#")) {
          savedMap[key.replace("#", ":")] = val;
        } else if (key.includes(":")) {
          savedMap[key.replace(":", "#")] = val;
        }
      }
    }
    return savedMap;
  } catch (err) {
    console.error("Error checking Learn Later status:", err);
    return savedMap;
  }
}
