import jwt from "jsonwebtoken";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

function normalizeStreakValue(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function touchUserLoginMetrics(userDoc) {
  const now = new Date();
  const lastLoginAt = userDoc.lastLoginAt ? new Date(userDoc.lastLoginAt) : null;

  let streaks = normalizeStreakValue(userDoc.streaks, 1);
  let highestStreak = normalizeStreakValue(userDoc.highestStreak, 1);

  if (lastLoginAt) {
    const diffDays = Math.floor(
      (getDayStart(now).getTime() - getDayStart(lastLoginAt).getTime()) / 86400000
    );

    if (diffDays === 1) {
      streaks += 1;
    } else if (diffDays > 1) {
      streaks = 1;
    }
  }

  highestStreak = Math.max(highestStreak, streaks);

  userDoc.lastLoginAt = now;
  userDoc.streaks = streaks;
  userDoc.highestStreak = highestStreak;

  await userDoc.save();
}

export async function resolveAuthenticatedUser(req, options = {}) {
  const { withMeta = false } = options;

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return withMeta
      ? { user: null, tokenProvided: false, tokenInvalid: false, reason: null }
      : null;
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return withMeta
      ? { user: null, tokenProvided: true, tokenInvalid: true, reason: "missing-token" }
      : null;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userDoc = await User.findById(decoded.userId);
    if (!userDoc) {
      return withMeta
        ? { user: null, tokenProvided: true, tokenInvalid: true, reason: "user-not-found" }
        : null;
    }

    const decodedUsn = String(decoded.usn || "").toUpperCase();
    const actualUsn = String(userDoc.usn || "").toUpperCase();
    if (decodedUsn && actualUsn && decodedUsn !== actualUsn) {
      return withMeta
        ? { user: null, tokenProvided: true, tokenInvalid: true, reason: "usn-mismatch" }
        : null;
    }

    if (userDoc.token && userDoc.token !== token) {
      return withMeta
        ? { user: null, tokenProvided: true, tokenInvalid: true, reason: "token-revoked" }
        : null;
    }

    await touchUserLoginMetrics(userDoc);

    const safeUser = userDoc.toObject();

    return withMeta
      ? { user: safeUser, tokenProvided: true, tokenInvalid: false, reason: null }
      : safeUser;
  } catch {
    return withMeta
      ? { user: null, tokenProvided: true, tokenInvalid: true, reason: "token-expired-or-invalid" }
      : null;
  }
}
