/**
 * Utility functions for handling PDF file downloads with proper filenames
 * in the Updates and Upload Updates sections.
 */

/**
 * Checks if a given file object or URL represents a PDF file.
 *
 * @param {string|object} fileOrUrl - URL string or file object { url, name, format, resourceType }
 * @param {string} [name] - Optional file name
 * @returns {boolean}
 */
export function isPdfFile(fileOrUrl, name) {
  const url = typeof fileOrUrl === "string" ? fileOrUrl : (fileOrUrl?.url || "");
  const fileName = name || (typeof fileOrUrl === "object" ? fileOrUrl?.name : "") || "";

  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  const cleanName = fileName.split("?")[0].split("#")[0].toLowerCase();

  return (
    cleanUrl.endsWith(".pdf") ||
    cleanName.endsWith(".pdf") ||
    fileOrUrl?.format === "pdf" ||
    fileOrUrl?.resourceType === "pdf"
  );
}

/**
 * Resolves the actual filename for downloading a PDF.
 * If the file name is generic (like "blob.pdf", "blob", or timestamp_blob.pdf),
 * it falls back to the update's title or a safe document name.
 *
 * @param {string|object} fileOrUrl - URL string or file object
 * @param {string} [name] - Existing file name
 * @param {string} [fallbackTitle] - Update title to use as fallback
 * @returns {string} - Filename guaranteed to end with .pdf
 */
export function getPdfDownloadName(fileOrUrl, name, fallbackTitle) {
  const url = typeof fileOrUrl === "string" ? fileOrUrl : (fileOrUrl?.url || "");
  let resolvedName =
    name ||
    (typeof fileOrUrl === "object" ? fileOrUrl?.name : "") ||
    url.split("?")[0].split("#")[0].split("/").pop() ||
    "";

  resolvedName = resolvedName.trim();

  // Check if name is empty or a generic blob name (e.g. "blob", "blob.pdf", "174123456_blob.pdf")
  const isGeneric =
    !resolvedName ||
    /^blob(\.pdf)?$/i.test(resolvedName) ||
    /^\d+[-_]blob(\.pdf)?$/i.test(resolvedName);

  if (isGeneric && fallbackTitle) {
    resolvedName = fallbackTitle.trim();
  }

  if (!resolvedName || isGeneric) {
    resolvedName = "document";
  }

  // Ensure it has .pdf extension
  if (!resolvedName.toLowerCase().endsWith(".pdf")) {
    resolvedName = `${resolvedName}.pdf`;
  }

  return resolvedName;
}

/**
 * Generates the proxy download URL that forces same-origin download with Content-Disposition.
 *
 * @param {string} url - Remote file URL (e.g. Cloudinary)
 * @param {string} [name] - Desired download name
 * @param {string} [fallbackTitle] - Fallback title
 * @returns {string}
 */
export function getPdfDownloadUrl(url, name, fallbackTitle) {
  if (!url) return "";
  const actualName = getPdfDownloadName(url, name, fallbackTitle);
  const cleanUrl = typeof url === "string" ? url.replace("/upload/fl_attachment/", "/upload/") : "";
  return `/api/updates/download?url=${encodeURIComponent(cleanUrl)}&name=${encodeURIComponent(actualName)}&title=${encodeURIComponent(fallbackTitle || "")}`;
}

/**
 * Downloads a PDF file with its actual file name, avoiding "blob.pdf".
 *
 * @param {string} url - Source file URL
 * @param {string} [name] - Target file name
 * @param {string} [fallbackTitle] - Fallback title
 * @param {function} [onStateChange] - Optional loading callback (boolean)
 */
export async function downloadPdfFile(url, name, fallbackTitle, onStateChange) {
  if (!url) return;
  const actualName = getPdfDownloadName(url, name, fallbackTitle);
  const proxyUrl = getPdfDownloadUrl(url, actualName, fallbackTitle);
  const cleanUrl = typeof url === "string" ? url.replace("/upload/fl_attachment/", "/upload/") : "";

  if (onStateChange) onStateChange(true);

  const triggerAnchor = (href, downloadFilename) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = href;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  try {
    // Primary method: Fetch via proxy endpoint /api/updates/download
    // This avoids CORS issues, correctly streams bytes, and allows local Blob creation
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`Proxy download returned HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    triggerAnchor(blobUrl, actualName);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
    if (onStateChange) onStateChange(false);
    return;
  } catch (proxyErr) {
    console.warn("Proxy blob download failed, trying direct fetch:", proxyErr);
  }

  try {
    // Fallback 1: Direct fetch from clean remote URL
    const res = await fetch(cleanUrl);
    if (!res.ok) throw new Error(`Direct fetch returned HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    triggerAnchor(blobUrl, actualName);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
    if (onStateChange) onStateChange(false);
    return;
  } catch (directErr) {
    console.warn("Direct blob download failed, falling back to direct anchor navigation:", directErr);
  }

  // Fallback 2: Trigger anchor to proxy download URL
  try {
    triggerAnchor(proxyUrl, actualName);
  } catch (finalErr) {
    console.error("All download attempts failed:", finalErr);
    window.open(cleanUrl, "_blank", "noopener,noreferrer");
  } finally {
    if (onStateChange) onStateChange(false);
  }
}

