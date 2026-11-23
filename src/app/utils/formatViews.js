/**
 * Format raw view count into short human-readable string:
 * - 0 - 999: exact number (e.g., "450")
 * - 1,000 - 999,999: "1k", "1.5k", "240k"
 * - >= 1,000,000: "1M", "2.4M"
 *
 * @param {number|string} count
 * @returns {string}
 */
export function formatViews(count) {
  const num = Number(count);
  if (!Number.isFinite(num) || num <= 0) return "0";

  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1).replace(/\.0$/, "");
    return `${formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1).replace(/\.0$/, "");
    return `${formatted}k`;
  }
  return num.toString();
}

/**
 * Format exact view count with commas (e.g. "1,245 views") for hover tooltips.
 *
 * @param {number|string} count
 * @returns {string}
 */
export function formatExactViews(count) {
  const num = Number(count);
  if (!Number.isFinite(num) || num <= 0) return "0 views";
  return `${num.toLocaleString("en-IN")} ${num === 1 ? "view" : "views"}`;
}

