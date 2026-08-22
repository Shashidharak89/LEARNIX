import { getYouTubeVideoId } from './youtube';

/**
 * Checks if a hostname or IP string is private/internal (SSRF protection).
 * @param {string} hostname
 * @returns {boolean}
 */
function isPrivateHost(hostname) {
  if (!hostname) return true;
  const host = hostname.toLowerCase().trim();

  // Block localhost and internal names
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan')
  ) {
    return true;
  }

  // IPv4 Private Ranges & Cloud Metadata IP (169.254.169.254)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const [, a, b] = match.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 Link-local / Cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true;
  }

  return false;
}

/**
 * Extracts meta tag attribute content by key name/property.
 */
function getMetaTag(html, nameOrProperty) {
  const propertyRegex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${nameOrProperty}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  let match = html.match(propertyRegex);
  if (match && match[1]) return match[1].trim();

  // Reverse attribute order (content before property/name)
  const contentFirstRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${nameOrProperty}["']`,
    'i'
  );
  match = html.match(contentFirstRegex);
  if (match && match[1]) return match[1].trim();

  return null;
}

/**
 * Extracts <title> text from HTML.
 */
function getTitleTag(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Resolves relative URLs to absolute.
 */
function resolveUrl(relative, base) {
  if (!relative) return null;
  try {
    return new URL(relative, base).toString();
  } catch (e) {
    return relative;
  }
}

/**
 * Fetches and extracts preview metadata from any URL.
 * @param {string} targetUrl
 * @returns {Promise<Object>} Normalized preview metadata
 */
export async function extractLinkPreview(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { error: 'Invalid URL provided', type: 'unknown' };
  }

  let formattedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(formattedUrl);
  } catch (err) {
    return { error: 'Malformed URL', type: 'unknown', url: targetUrl };
  }

  const hostname = parsedUrl.hostname;
  const domain = hostname.replace(/^www\./i, '');

  // SSRF Protection
  if (isPrivateHost(hostname)) {
    return { error: 'Access to private host restricted', type: 'unknown', url: formattedUrl, domain };
  }

  // 1. YouTube Provider Handler
  const ytVideoId = getYouTubeVideoId(formattedUrl);
  if (ytVideoId) {
    return {
      url: formattedUrl,
      canonicalUrl: `https://www.youtube.com/watch?v=${ytVideoId}`,
      domain: 'youtube.com',
      siteName: 'YouTube',
      type: 'youtube/video',
      title: 'YouTube Video',
      description: 'Click to play YouTube video',
      image: `https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${ytVideoId}`,
      videoId: ytVideoId
    };
  }

  // 2. Google Drive Provider Handler
  if (domain.includes('drive.google.com') || domain.includes('docs.google.com')) {
    let title = 'Google Drive Document';
    let docType = 'document';

    if (formattedUrl.includes('/spreadsheets/')) title = 'Google Sheets Document';
    else if (formattedUrl.includes('/presentation/')) title = 'Google Slides Presentation';
    else if (formattedUrl.includes('/forms/')) title = 'Google Forms';
    else if (formattedUrl.includes('/folders/')) title = 'Google Drive Folder';

    return {
      url: formattedUrl,
      canonicalUrl: formattedUrl,
      domain,
      siteName: 'Google Drive',
      type: 'google-drive',
      title,
      description: 'Shared file on Google Drive',
      image: null,
      embedUrl: null
    };
  }

  // 3. Direct Image or Document File Extension Check
  const pathname = parsedUrl.pathname.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(pathname)) {
    const filename = pathname.split('/').pop() || 'Image';
    return {
      url: formattedUrl,
      canonicalUrl: formattedUrl,
      domain,
      siteName: domain,
      type: 'image',
      title: filename,
      description: `Direct Image (${filename})`,
      image: formattedUrl,
      embedUrl: null
    };
  }

  if (/\.(pdf|docx?|xlsx?|pptx?|zip|tar|gz)$/i.test(pathname)) {
    const filename = pathname.split('/').pop() || 'Document';
    return {
      url: formattedUrl,
      canonicalUrl: formattedUrl,
      domain,
      siteName: domain,
      type: 'document',
      title: filename,
      description: `Document file (${filename})`,
      image: null,
      embedUrl: null
    };
  }

  // 4. Server-Side Fetch & Open Graph Metadata Extraction
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(formattedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const finalUrl = response.url || formattedUrl;

    // Handle Direct Image Content-Type
    if (contentType.startsWith('image/')) {
      return {
        url: formattedUrl,
        canonicalUrl: finalUrl,
        domain,
        siteName: domain,
        type: 'image',
        title: domain,
        description: 'Direct image link',
        image: finalUrl,
        embedUrl: null
      };
    }

    if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
      return {
        url: formattedUrl,
        canonicalUrl: finalUrl,
        domain,
        siteName: domain,
        type: 'document',
        title: domain,
        description: `File link (${contentType.split(';')[0]})`,
        image: null,
        embedUrl: null
      };
    }

    // Read first 250KB of HTML to save memory and process metadata
    const reader = response.body.getReader();
    let html = '';
    let bytesRead = 0;
    const maxBytes = 250000;

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder('utf-8').decode(value, { stream: true });
      bytesRead += value.length;
    }

    // Extract Open Graph & HTML Meta fields
    const title =
      getMetaTag(html, 'og:title') ||
      getMetaTag(html, 'twitter:title') ||
      getTitleTag(html) ||
      domain;

    const description =
      getMetaTag(html, 'og:description') ||
      getMetaTag(html, 'twitter:description') ||
      getMetaTag(html, 'description') ||
      null;

    const rawImage =
      getMetaTag(html, 'og:image') ||
      getMetaTag(html, 'twitter:image') ||
      getMetaTag(html, 'og:image:secure_url') ||
      null;

    const siteName =
      getMetaTag(html, 'og:site_name') ||
      domain;

    const image = resolveUrl(rawImage, finalUrl);

    return {
      url: formattedUrl,
      canonicalUrl: finalUrl,
      domain,
      siteName,
      type: 'website',
      title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      description: description ? description.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : null,
      image,
      embedUrl: null
    };
  } catch (err) {
    // Fallback response for blocked/failed requests
    return {
      url: formattedUrl,
      canonicalUrl: formattedUrl,
      domain,
      siteName: domain,
      type: 'website',
      title: domain,
      description: formattedUrl,
      image: null,
      embedUrl: null
    };
  }
}
