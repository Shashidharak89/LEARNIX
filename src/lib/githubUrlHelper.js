/**
 * Automatically converts any standard GitHub file URL to a raw GitHub URL (raw.github.com).
 * Example:
 *   https://github.com/Shashidharak89/LEARNIX-UPLOAD-FILES/blob/main/doc.pdf
 *   -> https://raw.github.com/Shashidharak89/LEARNIX-UPLOAD-FILES/main/doc.pdf
 */
export function formatGithubRawUrl(url) {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();

  if (trimmed.includes("github.com") || trimmed.includes("raw.githubusercontent.com")) {
    trimmed = trimmed
      .replace(/https?:\/\/(www\.)?github\.com\//i, "https://raw.github.com/")
      .replace(/https?:\/\/raw\.githubusercontent\.com\//i, "https://raw.github.com/")
      .replace(/\/blob\//i, "/")
      .replace(/\/bolb\//i, "/")
      .replace(/\/raw\//i, "/");
  }

  return trimmed;
}

