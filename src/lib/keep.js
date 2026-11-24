import { DeleteCommand, GetCommand, QueryCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, KEEP_TABLE } from "@/lib/dynamodb";
import { KEEP_CONTENT_LIMIT, KEEP_PAGE_SIZE, keepPageNumber } from "@/lib/keepFields";
import { randomUUID } from "node:crypto";

const key = (userId, itemId) => ({ userId, itemId });
const cleanTitle = (value) => typeof value === "string" ? value.trim().slice(0, 180) : "";
const contentText = (value) => typeof value === "string" ? value.slice(0, KEEP_CONTENT_LIMIT) : "";

export async function listKeepItems(userId, { page, size, search = "", type = "all" } = {}) {
  const items = [];
  let cursor;
  do {
    const result = await docClient.send(new QueryCommand({
      TableName: KEEP_TABLE,
      KeyConditionExpression: "userId = :uid AND begins_with(itemId, :prefix)",
      ExpressionAttributeValues: { ":uid": userId, ":prefix": "keep#" },
      ExclusiveStartKey: cursor,
      ConsistentRead: true,
    }));
    items.push(...(result.Items || []));
    cursor = result.LastEvaluatedKey;
  } while (cursor);

  const query = search.trim().slice(0, 200).toLowerCase();
  const filtered = items
    .filter((item) => type === "all" || item.type === type)
    .filter((item) => !query || [item.title, item.content, item.url, item.file?.name]
      .some((value) => String(value || "").toLowerCase().includes(query)))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
      (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt) ||
      a.itemId.localeCompare(b.itemId));
  const safeSize = Math.min(50, keepPageNumber(size, KEEP_PAGE_SIZE));
  const pages = Math.ceil(filtered.length / safeSize);
  const safePage = Math.min(keepPageNumber(page), Math.max(1, pages));
  return {
    items: filtered.slice((safePage - 1) * safeSize, safePage * safeSize),
    total: filtered.length,
    page: safePage,
    size: safeSize,
    pages,
  };
}

export async function getKeepItem(userId, itemId) {
  const result = await docClient.send(new GetCommand({
    TableName: KEEP_TABLE, Key: key(userId, itemId), ConsistentRead: true,
  }));
  return result.Item;
}

export async function createKeepItem(userId, payload) {
  let title = cleanTitle(payload.title);
  if (!title) {
    const counter = await docClient.send(new UpdateCommand({
      TableName: KEEP_TABLE,
      Key: key(userId, "META#counter"),
      UpdateExpression: "ADD untitledCount :inc",
      ExpressionAttributeValues: { ":inc": 1 },
      ReturnValues: "UPDATED_NEW",
    }));
    const count = counter.Attributes.untitledCount;
    title = count === 1 ? "Untitled" : `Untitled-${count - 1}`;
  }

  const now = new Date().toISOString();
  const item = {
    ...key(userId, `keep#${randomUUID()}`),
    title,
    type: payload.type,
    content: contentText(payload.content),
    url: payload.url || "",
    file: payload.file || undefined,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: KEEP_TABLE, Item: item }));
  return item;
}

export async function updateKeepItem(userId, itemId, changes) {
  const fields = {};
  if (typeof changes.content === "string") fields.content = contentText(changes.content);
  if (typeof changes.url === "string") fields.url = changes.url;
  if (cleanTitle(changes.title)) fields.title = cleanTitle(changes.title);
  if (changes.file) fields.file = changes.file;
  if (typeof changes.pinned === "boolean") fields.pinned = changes.pinned;
  if (changes.type) fields.updatedAt = new Date().toISOString();

  const entries = Object.entries(fields);
  const result = await docClient.send(new UpdateCommand({
    TableName: KEEP_TABLE,
    Key: key(userId, itemId),
    UpdateExpression: `SET ${entries.map(([name]) => `#${name} = :${name}`).join(", ")}`,
    ConditionExpression: changes.type ? "attribute_exists(itemId) AND #type = :type" : "attribute_exists(itemId)",
    ExpressionAttributeNames: {
      ...Object.fromEntries(entries.map(([name]) => [`#${name}`, name])),
      ...(changes.type ? { "#type": "type" } : {}),
    },
    ExpressionAttributeValues: {
      ...Object.fromEntries(entries.map(([name, value]) => [`:${name}`, value])),
      ...(changes.type ? { ":type": changes.type } : {}),
    },
    ReturnValues: "ALL_OLD",
  }));
  return { previous: result.Attributes, item: { ...result.Attributes, ...fields } };
}

export async function deleteKeepItem(userId, itemId) {
  const result = await docClient.send(new DeleteCommand({
    TableName: KEEP_TABLE,
    Key: key(userId, itemId),
    ConditionExpression: "attribute_exists(itemId)",
    ReturnValues: "ALL_OLD",
  }));
  return result.Attributes;
}
