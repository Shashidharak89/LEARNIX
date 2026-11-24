import { DeleteCommand, QueryCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, KEEP_TABLE } from "@/lib/dynamodb";
import { randomUUID } from "node:crypto";

const cleanText = (value, max = 30000) => String(value ?? "").trim().slice(0, max);

export async function listKeepItems(userId, { page = 1, size = 10, search = "", type = "all" } = {}) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await docClient.send(new QueryCommand({
      TableName: KEEP_TABLE,
      KeyConditionExpression: "userId = :uid AND begins_with(itemId, :prefix)",
      ExpressionAttributeValues: { ":uid": String(userId), ":prefix": "keep#" },
      ExclusiveStartKey,
    }));
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  const query = cleanText(search, 200).toLowerCase();
  const filtered = items
    .filter((item) => type === "all" || item.type === type)
    .filter((item) => !query || [item.title, item.content, item.url, item.file?.name]
      .some((value) => String(value || "").toLowerCase().includes(query)))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
      String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(50, Math.max(1, Number(size) || 10));
  return { items: filtered.slice((safePage - 1) * safeSize, safePage * safeSize), total: filtered.length, page: safePage, size: safeSize, pages: Math.ceil(filtered.length / safeSize) };
}

export async function createKeepItem(userId, payload) {
  const itemType = ["text", "link", "file"].includes(payload.type) ? payload.type : "text";
  const title = cleanText(payload.title, 180);
  let finalTitle = title;
  if (!finalTitle) {
    const counter = await docClient.send(new UpdateCommand({
      TableName: KEEP_TABLE,
      Key: { userId: String(userId), itemId: "META#counter" },
      UpdateExpression: "ADD untitledCount :inc",
      ExpressionAttributeValues: { ":inc": 1 },
      ReturnValues: "UPDATED_NEW",
    }));
    const count = Number(counter.Attributes?.untitledCount || 1);
    finalTitle = count === 1 ? "Untitled" : `Untitled-${count - 1}`;
  }
  const now = new Date().toISOString();
  const item = {
    userId: String(userId), itemId: `keep#${randomUUID()}`, title: finalTitle,
    type: itemType, content: cleanText(payload.content, 30000),
    url: cleanText(payload.url, 2048), file: payload.file || undefined,
    pinned: false, createdAt: now, updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: KEEP_TABLE, Item: item }));
  return item;
}

export async function updateKeepItem(userId, itemId, changes) {
  const key = { userId: String(userId), itemId: String(itemId) };
  const fields = {};
  if (Object.prototype.hasOwnProperty.call(changes, "content")) fields.content = cleanText(changes.content, 30000);
  if (Object.prototype.hasOwnProperty.call(changes, "url")) fields.url = cleanText(changes.url, 2048);
  const title = cleanText(changes.title, 180);
  if (title) fields.title = title;
  const setExpressions = ["updatedAt = :updatedAt"];
  const values = { ":updatedAt": new Date().toISOString() };
  const names = {};
  for (const [name, value] of Object.entries(fields)) {
    setExpressions.push(`${name} = :${name}`);
    values[`:${name}`] = value;
  }
  if (["text", "link", "file"].includes(changes.type)) {
    setExpressions.push("#type = :itemType");
    names["#type"] = "type";
    values[":itemType"] = changes.type;
  }
  if (changes.file && typeof changes.file === "object") {
    setExpressions.push("file = :file");
    values[":file"] = changes.file;
  }
  if (typeof changes.pinned === "boolean") {
    setExpressions.push("pinned = :pinned");
    values[":pinned"] = changes.pinned;
  }
  const result = await docClient.send(new UpdateCommand({
    TableName: KEEP_TABLE, Key: key,
    UpdateExpression: `SET ${setExpressions.join(", ")}`,
    ConditionExpression: "attribute_exists(itemId) AND begins_with(itemId, :prefix)",
    ...(Object.keys(names).length ? { ExpressionAttributeNames: names } : {}),
    ExpressionAttributeValues: { ...values, ":prefix": "keep#" },
    ReturnValues: "ALL_NEW",
  }));
  return result.Attributes;
}

export async function deleteKeepItem(userId, itemId) {
  await docClient.send(new DeleteCommand({
    TableName: KEEP_TABLE,
    Key: { userId: String(userId), itemId: String(itemId) },
    ConditionExpression: "attribute_exists(itemId) AND begins_with(itemId, :prefix)",
    ExpressionAttributeValues: { ":prefix": "keep#" },
  }));
}
