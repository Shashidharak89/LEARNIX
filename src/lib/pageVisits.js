const ROUTE_TEMPLATES = [
  ["/admin/users/profile", "[usn]"],
  ["/articles", "[id]"],
  ["/chat", "[userId]"],
  ["/learn/quiz", "[conceptId]"],
  ["/learnix-code/problems", "[problemid]"],
  ["/qp", "[id]"],
  ["/qp/query", "[subject]"],
  ["/qp/subject", "[id]"],
  ["/resources", "[id]"],
  ["/resources/subject", "[subjectid]"],
  ["/reviews", "[topicId]"],
  ["/search", "[usn]"],
  ["/updates", "[id]"],
  ["/upload/topic/edit", "[topicId]"],
  ["/users", "[usn]"],
];

const EXACT_STATIC_PATHS = new Set([
  "/qp/compiled",
  "/qp/filter",
  "/resources/upload",
]);

export function normalizePageUrl(value) {
  let path = String(value || "").trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.split(/[?#]/, 1)[0].replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path || path === "/") return "/";
  if (EXACT_STATIC_PATHS.has(path)) return path;

  for (const [prefix, parameter] of ROUTE_TEMPLATES) {
    if (path.startsWith(`${prefix}/`)) {
      const suffix = path.slice(prefix.length + 1);
      if (suffix && !suffix.includes("/")) return `${prefix}/${parameter}`;
    }
  }

  return path;
}

export function getLearnixDateId(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isValidDateId(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
