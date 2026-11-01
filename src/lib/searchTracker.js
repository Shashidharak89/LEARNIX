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
export async function getSearches({ page = 1, size = 20, search = "" } = {}) {
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

  // Filter if search query exists
  if (searchTerm) {
    allItems = allItems.filter((item) => {
      const kw = String(item.keyword || "").toLowerCase();
      const src = String(item.source || "").toLowerCase();
      const uid = String(item.userId || "").toLowerCase();
      const usn = String(item.usn || "").toLowerCase();
      const email = String(item.userEmail || "").toLowerCase();
      const ip = String(item.ip || "").toLowerCase();

      return (
        kw.includes(searchTerm) ||
        src.includes(searchTerm) ||
        uid.includes(searchTerm) ||
        usn.includes(searchTerm) ||
        email.includes(searchTerm) ||
        ip.includes(searchTerm)
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
