export const VISIBILITY_VALUES = ["public", "private", "unlisted"];

export function normalizeVisibility(value) {
  if (typeof value !== "string") return "public";
  const cleaned = value.trim().toLowerCase();
  return VISIBILITY_VALUES.includes(cleaned) ? cleaned : "public";
}

export function getVisibility(entity) {
  return normalizeVisibility(entity?.visibility);
}

export function isPublicVisibility(entity) {
  return getVisibility(entity) === "public";
}

export function isAccessibleToNonOwner(entity) {
  const visibility = getVisibility(entity);
  return visibility === "public" || visibility === "unlisted";
}

export function visibilityLabel(value) {
  const normalized = normalizeVisibility(value);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
