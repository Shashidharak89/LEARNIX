import jwt from "jsonwebtoken";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

function normalizeStreakValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

// Helper to determine the calendar day difference between two dates
// in local timezone (or standard calendar day 00:00 - 23:59)
function getCalendarDayDifference(fromDate, toDate) {
  const d1 = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const d2 = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

/**
 * Returns the effective current streak for a user.
 * If user hasn't logged in within today or yesterday (diffDays > 1 or no login),
 * the streak resets to 0.
 */
export function calculateCurrentStreak(user) {
  if (!user || !user.lastLoginAt) return 0;
  const now = new Date();
  const lastLoginAt = new Date(user.lastLoginAt);
  const diffDays = getCalendarDayDifference(lastLoginAt, now);

  if (diffDays > 1) {
    return 0;
  }
  return normalizeStreakValue(user.streaks, 0);
}

export async function touchUserLoginMetrics(userDoc) {
  const now = new Date();
  const lastLoginAt = userDoc.lastLoginAt ? new Date(userDoc.lastLoginAt) : null;

  let streaks = normalizeStreakValue(userDoc.streaks, 0);
  let highestStreak = normalizeStreakValue(userDoc.highestStreak, 0);

  if (!lastLoginAt) {
    // First ever login starts streak at 1
    streaks = 1;
  } else {
    const diffDays = getCalendarDayDifference(lastLoginAt, now);

    if (diffDays === 0) {
      // Same calendar day (00:00 to 23:59): streak stays unchanged
      // If streaks was 0 for any reason, start at 1
      if (streaks === 0) streaks = 1;
    } else if (diffDays === 1) {
      // Consecutive calendar day: streak increments
      streaks = (streaks || 0) + 1;
    } else {
      // Missed a day or more: streak was 0, now new login starts from 1
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
