export const KEEP_FILE_LIMIT = 20 * 1024 * 1024;
export const KEEP_CONTENT_LIMIT = 30000;
export const KEEP_PAGE_SIZE = 10;
export const KEEP_TYPES = ["text", "link", "file"];

export function keepContentError({ type, content, url, file }) {
  if (content != null && (typeof content !== "string" || content.length > KEEP_CONTENT_LIMIT)) {
    return "Keep text must be 30,000 characters or fewer.";
  }
  if (type === "text" && !content?.trim()) return "Write something in your note before saving.";
  if (type === "link" && !keepWebUrl(url)) return "Enter a valid HTTP or HTTPS link.";
  if (type === "file" && !file) return "Choose a file to upload.";
  return "";
}

export function keepPageNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

export function keepWebUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function keepYouTubeId(value) {
  const url = keepWebUrl(value);
  if (!url) return "";
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const [, path, id] = url.pathname.split("/");
  let video;
  if (host === "youtu.be") video = path;
  if (host === "youtube.com") {
    if (path === "watch") video = url.searchParams.get("v");
    if (["shorts", "embed", "live"].includes(path)) video = id;
  }
  return /^[\w-]{11}$/.test(video || "") ? video : "";
}
