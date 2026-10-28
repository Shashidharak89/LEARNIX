import { docClient, LEARN_LATER_TABLE } from "./dynamodb.js";
import {
  PutCommand,
  DeleteCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

export function normalizeItemType(type) {
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

export function buildItemId(type, targetId) {
  const normType = normalizeItemType(type);
  const cleanId = String(targetId || "").trim();
  return `${normType}#${cleanId}`;
}

/**
 * Add an item to Learn Later
 */
export async function addToLearnLater(userId, payload) {
  if (!userId) throw new Error("User ID is required");
  const type = normalizeItemType(payload.type);
  const targetId = String(payload.targetId || payload.id || "").trim();
  if (!targetId) throw new Error("Target ID is required");

  const itemId = buildItemId(type, targetId);
  const now = new Date().toISOString();

  const item = {
    userId: String(userId),
    itemId,
    id: itemId,
    type,
    targetId,
    title: String(payload.title || "Untitled").trim(),
    subtitle: String(payload.subtitle || payload.subjectName || payload.subject || "").trim(),
    description: String(payload.description || payload.content || "").trim(),
    url: String(payload.url || payload.link || "").trim(),
    thumbnail: payload.thumbnail || (Array.isArray(payload.images) && payload.images[0]) || "",
    metadata: payload.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: LEARN_LATER_TABLE,
      Item: item,
    })
  );

  return item;
}

/**
 * Remove an item from Learn Later
 */
export async function removeFromLearnLater(userId, { itemId, type, targetId }) {
  if (!userId) throw new Error("User ID is required");
  const resolvedItemId = itemId || buildItemId(type, targetId);

  await docClient.send(
    new DeleteCommand({
      TableName: LEARN_LATER_TABLE,
      Key: {
        userId: String(userId),
        itemId: resolvedItemId,
      },
    })
  );

  return { itemId: resolvedItemId };
}

/**
 * Toggle Learn Later status for an item
 */
export async function toggleLearnLater(userId, payload) {
  if (!userId) throw new Error("User ID is required");
  const type = normalizeItemType(payload.type);
  const targetId = String(payload.targetId || payload.id || "").trim();
  if (!targetId) throw new Error("Target ID is required");

  const itemId = buildItemId(type, targetId);

  // Check if exists
  const existing = await docClient.send(
    new GetCommand({
      TableName: LEARN_LATER_TABLE,
      Key: {
        userId: String(userId),
        itemId,
      },
    })
  );

  if (existing.Item) {
    await removeFromLearnLater(userId, { itemId });
    return { isSaved: false, itemId };
  } else {
    const savedItem = await addToLearnLater(userId, payload);
    return { isSaved: true, item: savedItem, itemId };
  }
}

/**
 * Fetch all Learn Later items for a user with search and type filter
 */
export async function getLearnLaterItems(userId, { type, search, sort = "newest" } = {}) {
  if (!userId) return { items: [], total: 0, counts: {} };

  const queryRes = await docClient.send(
    new QueryCommand({
      TableName: LEARN_LATER_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": String(userId),
      },
    })
  );

  let allItems = queryRes.Items || [];

  // Sort by createdAt
  allItems.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return sort === "oldest" ? timeA - timeB : timeB - timeA;
  });

  // Calculate category counts
  const counts = {
    all: allItems.length,
    resource: 0,
    update: 0,
    "study-material": 0,
    "question-paper": 0,
  };

  for (const it of allItems) {
    const t = normalizeItemType(it.type);
    if (counts[t] !== undefined) {
      counts[t] += 1;
    }
  }

  // Filter by type if requested
  let filtered = allItems;
  if (type && type !== "all") {
    const normType = normalizeItemType(type);
    filtered = filtered.filter((it) => normalizeItemType(it.type) === normType);
  }

  // Filter by search keyword if requested
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter((it) => {
      const titleMatch = (it.title || "").toLowerCase().includes(q);
      const subMatch = (it.subtitle || "").toLowerCase().includes(q);
      const descMatch = (it.description || "").toLowerCase().includes(q);
      const typeMatch = (it.type || "").toLowerCase().includes(q);
      const metaSubject = (it.metadata?.subjectName || "").toLowerCase().includes(q);
      const metaExam = (it.metadata?.examName || "").toLowerCase().includes(q);
      return titleMatch || subMatch || descMatch || typeMatch || metaSubject || metaExam;
    });
  }

  return {
    items: filtered,
    total: filtered.length,
    counts,
  };
}

/**
 * Bulk check which items are in Learn Later
 */
export async function checkItemsSaved(userId, itemKeys = []) {
  if (!userId || !Array.isArray(itemKeys) || itemKeys.length === 0) {
    return {};
  }

  const queryRes = await docClient.send(
    new QueryCommand({
      TableName: LEARN_LATER_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": String(userId),
      },
      ProjectionExpression: "itemId",
    })
  );

  const savedSet = new Set((queryRes.Items || []).map((it) => it.itemId));
  const resultMap = {};

  for (const key of itemKeys) {
    const resolvedId = typeof key === "string" ? key : buildItemId(key.type, key.targetId);
    resultMap[resolvedId] = savedSet.has(resolvedId);
  }

  return resultMap;
}
