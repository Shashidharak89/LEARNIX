import { docClient, SEARCHES_TABLE } from "./dynamodb.js";
import { PutCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

// In-memory cache to deduplicate identical searches from same user/IP within 3 seconds
const recentSearchesCache = new Map();
const DEDUPE_WINDOW_MS = 3000;

function cleanupDedupeCache() {
  const now = Date.now();
  for (const [key, timestamp] of recentSearchesCache.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS * 2) {
      recentSearchesCache.delete(key);
    }
  }
}

/**
 * Extract user ID and optional info from request auth header or cookies
 */
export function extractAuthFromReq(req) {
  try {
    if (!req) return { userId: null, userEmail: null, usn: null };

    let token = "";

    // 1. Authorization header
    const authHeader = req.headers?.get?.("authorization") || req.headers?.authorization || "";
    if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // 2. Cookie if not in header
    if (!token && req.cookies) {
      if (typeof req.cookies.get === "function") {
        token = req.cookies.get("token")?.value || "";
      } else if (req.cookies.token) {
        token = req.cookies.token;
      }
    }

    if (!token) {
      // Check custom header if present
      const xUserId = req.headers?.get?.("x-user-id") || req.headers?.["x-user-id"] || null;
      return { userId: xUserId ? String(xUserId) : null, userEmail: null, usn: null };
    }

    // Decode token (non-blocking)
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object") {
      return {
        userId: decoded.userId ? String(decoded.userId) : (decoded.id ? String(decoded.id) : (decoded._id ? String(decoded._id) : null)),
        userEmail: decoded.email ? String(decoded.email) : null,
        usn: decoded.usn ? String(decoded.usn) : null,
      };
    }

    return { userId: null, userEmail: null, usn: null };
  } catch (err) {
    return { userId: null, userEmail: null, usn: null };
  }
}

/**
 * Extract client IP from request headers
 */
export function extractClientIp(req) {
  if (!req?.headers) return null;
  const forwarded = req.headers.get?.("x-forwarded-for") || req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.headers.get?.("x-real-ip") || req.headers["x-real-ip"] || null;
}

/**
 * Extract operating system information from request
 */
export function extractOS(req) {
  if (!req?.headers) return "Unknown";

  const platform = req.headers.get?.("sec-ch-ua-platform") || req.headers["sec-ch-ua-platform"];
  if (platform) {
    const p = String(platform).replace(/"/g, "").trim().toLowerCase();
    if (p.includes("android")) return "Android";
    if (p.includes("ios")) return "iOS";
    if (p.includes("mac")) return "macOS";
    if (p.includes("windows")) return "Windows";
    if (p.includes("linux")) return "Linux";
    if (p.includes("chrome")) return "Chrome OS";
  }

  const xOs = req.headers.get?.("x-os") || req.headers["x-os"];
  if (xOs) return String(xOs).trim();

  const ua = (req.headers.get?.("user-agent") || req.headers["user-agent"] || "").toLowerCase();
  if (!ua) return "Unknown";

  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (ua.includes("macintosh") || ua.includes("mac os x")) return "macOS";
  if (ua.includes("windows nt") || ua.includes("win64") || ua.includes("windows")) return "Windows";
  if (ua.includes("cros")) return "Chrome OS";
  if (ua.includes("linux")) return "Linux";

  return "Other";
}

/**
 * Normalize source names into consistent canonical strings
 */
export function normalizeSearchSource(source) {
  const s = String(source || "").toLowerCase().trim();
  if (s.includes("navbar")) return "navbar";
  if (s.includes("home") || s === "hero" || s === "hero-search") return "home";
  if (s.includes("material") || s === "sm") return "study-materials";
  if (s.includes("paper") || s === "qp" || s.includes("question")) return "question-papers";
  if (s.includes("update")) return "updates";
  if (s.includes("resource") || s.includes("topic") || s.includes("work")) return "resources";
  return s || "unknown";
}

/**
 * Record a search event into DynamoDB asynchronously (fire-and-forget).
 * Does NOT block the caller or delay response.
 */
export function recordSearchEvent(keyword, source = "unknown", req = null, extraMeta = {}) {
  try {
    const rawKeyword = String(keyword || "").trim();
    if (!rawKeyword || rawKeyword.length === 0) return;

    // Remove quotes if any
    const cleanKeyword = rawKeyword.replace(/^["']|["']$/g, "").trim();
    if (!cleanKeyword) return;

    const normalizedSource = normalizeSearchSource(source);
    const { userId, userEmail, usn } = extractAuthFromReq(req);
    const ip = extractClientIp(req);
    const os = extractOS(req);
    const userAgent = req?.headers?.get?.("user-agent") || req?.headers?.["user-agent"] || null;

    // Deduplication key: ignore repeat identical searches within window (e.g. parallel category calls)
    const dedupeKey = `${userId || ip || "anon"}::${normalizedSource}::${cleanKeyword.toLowerCase()}`;
    const now = Date.now();
    const lastSeen = recentSearchesCache.get(dedupeKey);
    if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
      return;
    }
    recentSearchesCache.set(dedupeKey, now);
    if (recentSearchesCache.size > 500) {
      cleanupDedupeCache();
    }

    const id = `srch_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();

    const item = {
      id,
      entityType: "search",
      keyword: cleanKeyword,
      source: normalizedSource,
      userId: userId || null,
      userEmail: userEmail || null,
      usn: usn || null,
      os,
      timestamp: now,
      createdAt,
      ip: ip || null,
      userAgent: userAgent ? userAgent.substring(0, 300) : null,
      ...extraMeta,
    };

    // Asynchronously insert into DynamoDB without awaiting
    docClient
      .send(
        new PutCommand({
          TableName: SEARCHES_TABLE,
          Item: item,
        })
      )
      .catch((err) => {
        // Silently handle error so client is never affected
        console.error("DynamoDB Search Insert Error (async):", err?.message || err);
      });
  } catch (err) {
    // Non-blocking safety
    console.error("recordSearchEvent unexpected error:", err?.message || err);
  }
}

/**
 * Get paginated searches from DynamoDB with optional search query filter
 */
export async function getSearches({ page = 1, size = 20, search = "", range = "24h", startDate = "", endDate = "", source = "all" } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(size, 10) || 20));
  const searchTerm = String(search || "").trim().toLowerCase();

  // Try querying GSI entityType-createdAt-index first if no filter, or scan
  let allItems = [];
  try {
    // Querying with Scan to allow full text search on keyword, source, userId, etc.
    let scanParams = {
      TableName: SEARCHES_TABLE,
    };

    let items = [];
    let lastEvaluatedKey = undefined;

    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }
      const res = await docClient.send(new ScanCommand(scanParams));
      if (res.Items && res.Items.length > 0) {
        items.push(...res.Items);
      }
      lastEvaluatedKey = res.LastEvaluatedKey;
      // Cap at 2500 items scan for safety in single request
      if (items.length >= 2500) break;
    } while (lastEvaluatedKey);

    allItems = items;
  } catch (err) {
    console.error("Error scanning DynamoDB searches:", err);
    throw err;
  }

  // Filter by date range (default: last 24h)
  const now = Date.now();
  let startMs = 0;
  let endMs = now;

  if (range === "24h") {
    startMs = now - 24 * 60 * 60 * 1000;
  } else if (range === "7d") {
    startMs = now - 7 * 24 * 60 * 60 * 1000;
  } else if (range === "30d") {
    startMs = now - 30 * 24 * 60 * 60 * 1000;
  } else if (range === "custom") {
    if (startDate) {
      const s = new Date(startDate).getTime();
      if (!Number.isNaN(s)) startMs = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      if (!Number.isNaN(e.getTime())) endMs = e.getTime();
    }
  }

  if (range !== "all") {
    allItems = allItems.filter((item) => {
      const t = item.timestamp || (item.createdAt ? new Date(item.createdAt).getTime() : 0);
      if (!t) return false;
      if (startMs && t < startMs) return false;
      if (endMs && t > endMs) return false;
      return true;
    });
  }

  // Compute source stats for the selected date range
  const stats = {
    total: allItems.length,
    navbar: 0,
    home: 0,
    "study-materials": 0,
    "question-papers": 0,
    updates: 0,
    resources: 0,
  };
  const dailyMap = {};
  const sourceFilter = String(source || "all").toLowerCase();
  allItems.forEach((item) => {
    const src = String(item.source || "").toLowerCase();
    if (stats[src] !== undefined) stats[src] += 1;
    if (sourceFilter === "all" || src === sourceFilter) {
      const t = item.timestamp || (item.createdAt ? new Date(item.createdAt).getTime() : 0);
      if (t) {
        const d = new Date(t);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dailyMap[key] = (dailyMap[key] || 0) + 1;
      }
    }
  });
  const dailyStats = Object.keys(dailyMap)
    .sort()
    .map((date) => ({ date, count: dailyMap[date] }));

  // Filter if search query exists
  if (searchTerm) {
    allItems = allItems.filter((item) => {
      const kw = String(item.keyword || "").toLowerCase();
      const src = String(item.source || "").toLowerCase();
      const uid = String(item.userId || "").toLowerCase();
      const usn = String(item.usn || "").toLowerCase();
      const email = String(item.userEmail || "").toLowerCase();
      const ip = String(item.ip || "").toLowerCase();
      const os = String(item.os || "").toLowerCase();

      return (
        kw.includes(searchTerm) ||
        src.includes(searchTerm) ||
        uid.includes(searchTerm) ||
        usn.includes(searchTerm) ||
        email.includes(searchTerm) ||
        ip.includes(searchTerm) ||
        os.includes(searchTerm)
      );
    });
  }

  // Sort descending by timestamp / createdAt
  allItems.sort((a, b) => {
    const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  const total = allItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (pageNum - 1) * pageSize;
  const paginatedData = allItems.slice(offset, offset + pageSize);

  return {
    data: paginatedData,
    total,
    page: pageNum,
    size: pageSize,
    totalPages,
    stats,
    dailyStats,
  };
}

/**
 * Fetch all searches for CSV export
 */
export async function getAllSearchesForExport() {
  let allItems = [];
  let scanParams = {
    TableName: SEARCHES_TABLE,
  };

  let lastEvaluatedKey = undefined;
  do {
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }
    const res = await docClient.send(new ScanCommand(scanParams));
    if (res.Items && res.Items.length > 0) {
      allItems.push(...res.Items);
    }
    lastEvaluatedKey = res.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  allItems.sort((a, b) => {
    const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  return allItems;
}
