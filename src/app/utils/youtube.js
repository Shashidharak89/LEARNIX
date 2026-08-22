/**
 * Utility functions for YouTube URL parsing, Video ID extraction, Embed URLs, and Thumbnail URLs.
 */

/**
 * Extracts YouTube Video ID from various YouTube URL formats.
 * Supported formats:
 * - https://youtu.be/VIDEO_ID?si=...
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID&feature=shared
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - m.youtube.com / music.youtube.com variants
 *
 * @param {string} url - The URL string to parse
 * @returns {string|null} - 11-character Video ID or null if invalid/unsupported
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const str = url.trim();

  // Pattern matching standard YouTube URL structures
  const regExp = /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;
  const match = str.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // Robust URL object parsing fallback
  try {
    const parsedUrl = new URL(str.startsWith('http') ? str : `https://${str}`);
    const host = parsedUrl.hostname.replace(/^(www\.|m\.|music\.)/, '');

    if (host === 'youtu.be') {
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[0])) {
        return pathParts[0];
      }
    }

    if (host === 'youtube.com') {
      if (parsedUrl.searchParams.has('v')) {
        const id = parsedUrl.searchParams.get('v');
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && ['embed', 'v', 'shorts'].includes(pathParts[0])) {
        const id = pathParts[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }
    }
  } catch (e) {
    // Malformed URL string
  }

  return null;
}

/**
 * Generates YouTube Embed URL from a video ID or YouTube URL.
 * @param {string} urlOrId
 * @returns {string|null}
 */
export function getYouTubeEmbedUrl(urlOrId) {
  const videoId = /^[a-zA-Z0-9_-]{11}$/.test(urlOrId) ? urlOrId : getYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Generates YouTube Thumbnail URL from a video ID or YouTube URL.
 * @param {string} urlOrId
 * @param {'maxresdefault'|'hqdefault'|'mqdefault'|'sddefault'} quality
 * @returns {string|null}
 */
export function getYouTubeThumbnailUrl(urlOrId, quality = 'maxresdefault') {
  const videoId = /^[a-zA-Z0-9_-]{11}$/.test(urlOrId) ? urlOrId : getYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
