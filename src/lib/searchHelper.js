/**
 * searchHelper.js
 * Builds MongoDB query conditions for the /works search.
 * Supports searching by:
 *   - Topic name
 *   - Content
 *   - Subject name
 *   - Username
 *   - USN
 *   - MongoDB _id (ObjectId hex string)
 *   - Dates: "today", "yesterday", "april", "10-02-2026", "10/1/26", "10 April 2026", etc.
 */

import mongoose from "mongoose";
import Subject from "@/models/Subject";
import User from "@/models/User";

// ─── Month helpers ────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_SHORT = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function monthIndex(str) {
  const s = str.toLowerCase().trim();
  let i = MONTH_NAMES.indexOf(s);
  if (i !== -1) return i;
  i = MONTH_SHORT.findIndex(m => s.startsWith(m));
  return i; // -1 if not found
}

// ─── Date range parser ────────────────────────────────────────────────────────
/**
 * Parses a free-text query string and returns a { start, end } UTC date range
 * if the query looks like a date expression, or null if it doesn't look like one.
 *
 * Supported patterns:
 *   "today"
 *   "yesterday"
 *   Month name only:       "april"  → entire month of April in current year
 *   Full date variants:
 *     "10-02-2026"         (DD-MM-YYYY)
 *     "10/02/2026"         (DD/MM/YYYY)
 *     "10-1-26"            (DD-M-YY  → 2-digit year)
 *     "2026-04-10"         (YYYY-MM-DD ISO)
 *     "10 April 2026"      (D Month YYYY)
 *     "April 10 2026"      (Month D YYYY)
 *     "April 10, 2026"     (Month D, YYYY)
 *   Month + year:
 *     "April 2026"
 *     "04-2026"
 *     "04/2026"
 */
export function parseDateRange(q) {
  const raw = q.trim();
  const lower = raw.toLowerCase();

  // "today"
  if (lower === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // "yesterday"
  if (lower === "yesterday") {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Month name only: "april", "jan", "february"
  const moOnly = monthIndex(lower);
  if (moOnly !== -1 && /^[a-z]+$/i.test(raw)) {
    const year = new Date().getFullYear();
    const start = new Date(year, moOnly, 1, 0, 0, 0, 0);
    const end = new Date(year, moOnly + 1, 0, 23, 59, 59, 999); // last day of month
    return { start, end };
  }

  // "April 2026" or "apr 2026"
  const moYear = raw.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (moYear) {
    const mo = monthIndex(moYear[1]);
    if (mo !== -1) {
      const year = parseInt(moYear[2]);
      const start = new Date(year, mo, 1, 0, 0, 0, 0);
      const end = new Date(year, mo + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }

  // "04-2026" or "04/2026"  (MM-YYYY)
  const mmYYYY = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYYYY) {
    const mo = parseInt(mmYYYY[1]) - 1;
    const year = parseInt(mmYYYY[2]);
    if (mo >= 0 && mo <= 11) {
      const start = new Date(year, mo, 1, 0, 0, 0, 0);
      const end = new Date(year, mo + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }

  // "10 April 2026" or "10 apr 2026"
  const dMonY = raw.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})$/);
  if (dMonY) {
    const mo = monthIndex(dMonY[2]);
    if (mo !== -1) {
      const day = parseInt(dMonY[1]);
      let year = parseInt(dMonY[3]);
      if (year < 100) year += 2000;
      const start = new Date(year, mo, day, 0, 0, 0, 0);
      const end = new Date(year, mo, day, 23, 59, 59, 999);
      if (!isNaN(start.getTime())) return { start, end };
    }
  }

  // "April 10 2026" or "April 10, 2026"
  const monDY = raw.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (monDY) {
    const mo = monthIndex(monDY[1]);
    if (mo !== -1) {
      const day = parseInt(monDY[2]);
      let year = parseInt(monDY[3]);
      if (year < 100) year += 2000;
      const start = new Date(year, mo, day, 0, 0, 0, 0);
      const end = new Date(year, mo, day, 23, 59, 59, 999);
      if (!isNaN(start.getTime())) return { start, end };
    }
  }

  // Numeric date: "DD-MM-YYYY", "DD/MM/YYYY", "DD-M-YY", etc.
  // Also covers "YYYY-MM-DD" (ISO)
  const numDate = raw.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (numDate) {
    let a = parseInt(numDate[1]);
    let b = parseInt(numDate[2]);
    let c = parseInt(numDate[3]);

    let day, mo, year;

    if (a >= 1000) {
      // YYYY-MM-DD
      year = a; mo = b - 1; day = c;
    } else if (c >= 100) {
      // DD-MM-YYYY
      day = a; mo = b - 1; year = c;
    } else {
      // DD-MM-YY (2-digit year)
      day = a; mo = b - 1; year = 2000 + c;
    }

    if (mo >= 0 && mo <= 11 && day >= 1 && day <= 31) {
      const start = new Date(year, mo, day, 0, 0, 0, 0);
      const end = new Date(year, mo, day, 23, 59, 59, 999);
      if (!isNaN(start.getTime())) return { start, end };
    }
  }

  return null;
}

// ─── ObjectId check ───────────────────────────────────────────────────────────
function isObjectId(str) {
  return /^[a-fA-F0-9]{24}$/.test(str);
}

// ─── Main builder ─────────────────────────────────────────────────────────────
/**
 * Builds the $or array of conditions for free-text keyword search.
 * Searches across: topic name, content, subject name, username, USN, _id, date.
 *
 * @param {string} q - raw query string from user
 * @returns {Promise<Array>} array of MongoDB condition objects to be used in $or
 */
export async function buildKeywordConditions(q) {
  if (!q || !q.trim()) return [];

  const orConditions = [];

  // 1. Topic name (partial match)
  orConditions.push({ topic: { $regex: q, $options: "i" } });

  // 2. Content (partial match)
  orConditions.push({ content: { $regex: q, $options: "i" } });

  // 3. Subject name → find matching subjectIds
  const matchedSubjects = await Subject.find({
    subject: { $regex: q, $options: "i" },
  }).lean();
  if (matchedSubjects.length > 0) {
    orConditions.push({ subjectId: { $in: matchedSubjects.map(s => s._id) } });
  }

  // 4. Username or USN → find matching users → their subjectIds → topicIds via userId
  const matchedUsers = await User.find({
    $or: [
      { name: { $regex: q, $options: "i" } },
      { usn: { $regex: q, $options: "i" } },
    ],
  }).lean();
  if (matchedUsers.length > 0) {
    const userIds = matchedUsers.map(u => u._id);
    // Topics have userId stored directly
    orConditions.push({ userId: { $in: userIds } });
  }

  // 5. MongoDB _id (exact hex ObjectId)
  if (isObjectId(q.trim())) {
    orConditions.push({ _id: new mongoose.Types.ObjectId(q.trim()) });
  }

  // 6. Date parsing
  const dateRange = parseDateRange(q.trim());
  if (dateRange) {
    orConditions.push({
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });
  }

  return orConditions;
}
