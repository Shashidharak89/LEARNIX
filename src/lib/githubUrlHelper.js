/**
 * Automatically converts any standard GitHub file URL to a GitHub raw URL.
 * Example:
 *   https://github.com/user/repo/blob/main/doc.pdf
 *   -> https://raw.githubusercontent.com/user/repo/main/doc.pdf
 */
export function formatGithubRawUrl(url) {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();

  if (trimmed.includes("github.com")) {
    trimmed = trimmed
      .replace(/https?:\/\/github\.com\//i, "https://raw.githubusercontent.com/")
      .replace(/\/blob\//i, "/")
      .replace(/\/raw\//i, "/");
  }

  return trimmed;
}
