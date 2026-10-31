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

// ─── Helpers for Multi-Word Query Tokenization ──────────────────────────────
export function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getQueryWords(q) {
  if (!q) return [];
  return String(q)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

// ─── Main builder ─────────────────────────────────────────────────────────────
/**
 * Builds the $or array of conditions for free-text keyword search.
 * When a sentence is provided, it is split into words (like Study Materials)
 * while also matching the full phrase.
 * Searches across: topic name, content, subject name, username, USN, _id, date.
 *
 * @param {string} q - raw query string from user
 * @returns {Promise<Array>} array of MongoDB condition objects to be used in $or
 */
export async function buildKeywordConditions(q) {
  if (!q || !q.trim()) return [];

  const raw = q.trim();
  const words = getQueryWords(raw);
  if (words.length === 0) return [];

  const orConditions = [];

  // 1. Full phrase match (highest fidelity)
  const fullEsc = escapeRegex(raw);
  orConditions.push({ topic: { $regex: fullEsc, $options: "i" } });
  orConditions.push({ content: { $regex: fullEsc, $options: "i" } });

  // 2. Individual word matches (multi-word sentence splitting)
  for (const word of words) {
    if (word.length <= 1 && words.length > 1) continue; // skip single letters if multiple words
    const wordEsc = escapeRegex(word);
    orConditions.push({ topic: { $regex: wordEsc, $options: "i" } });
    orConditions.push({ content: { $regex: wordEsc, $options: "i" } });
  }

  // 3. Subject name: matches full phrase or any word
  const subjectPatterns = [fullEsc, ...words.map(escapeRegex)];
  const subjectRegexes = subjectPatterns.map((p) => new RegExp(p, "i"));
  const matchedSubjects = await Subject.find({
    subject: { $in: subjectRegexes },
  })
    .select("_id subject")
    .lean();

  if (matchedSubjects.length > 0) {
    orConditions.push({ subjectId: { $in: matchedSubjects.map((s) => s._id) } });
  }

  // 4. User: name or USN matches full phrase or any word
  const userPatterns = [fullEsc, ...words.map(escapeRegex)].map((p) => new RegExp(p, "i"));
  const matchedUsers = await User.find({
    $or: [
      { name: { $in: userPatterns } },
      { usn: { $in: userPatterns } },
    ],
  })
    .select("_id")
    .lean();

  if (matchedUsers.length > 0) {
    const userIds = matchedUsers.map((u) => u._id);
    orConditions.push({ userId: { $in: userIds } });
  }

  // 5. MongoDB _id (exact hex ObjectId)
  if (isObjectId(raw)) {
    orConditions.push({ _id: new mongoose.Types.ObjectId(raw) });
  }

  // 6. Date parsing
  const dateRange = parseDateRange(raw);
  if (dateRange) {
    orConditions.push({
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });
  }

  return orConditions;
}

/**
 * Scores a topic against the search query so that most matching topics
 * appear on top (just like Study Materials).
 * Detects match locations for "matched in" indicators.
 *
 * @param {Object} topic - Topic document with populated subject and user details
 * @param {string} rawQuery - Search query from user
 * @returns {Object} topic with matchScore, matchedIn (array), and matchedKeywords (array)
 */
export function scoreAndTagTopic(topic, rawQuery) {
  const query = (rawQuery || "").trim().toLowerCase();
  const words = getQueryWords(query);
  if (!query || words.length === 0) {
    return {
      ...topic,
      matchScore: 0,
      matchedIn: [],
      matchedKeywords: [],
    };
  }

  let score = 0;
  const matchedPlaces = new Set();
  const matchedWordSet = new Set();

  const title = String(topic.topic || "").toLowerCase();
  const content = String(topic.content || "").toLowerCase();
  const subject = String(topic.subject || topic.subjectName || "").toLowerCase();
  const userName = String(topic.userName || "").toLowerCase();
  const usn = String(topic.usn || "").toLowerCase();

  // ── 1. Full phrase bonuses ──
  if (title === query) {
    score += 150;
    matchedPlaces.add("Topic Title");
  } else if (title.startsWith(query)) {
    score += 80;
    matchedPlaces.add("Topic Title");
  } else if (title.includes(query)) {
    score += 50;
    matchedPlaces.add("Topic Title");
  }

  if (subject === query) {
    score += 100;
    matchedPlaces.add("Subject");
  } else if (subject.startsWith(query)) {
    score += 60;
    matchedPlaces.add("Subject");
  } else if (subject.includes(query)) {
    score += 40;
    matchedPlaces.add("Subject");
  }

  if (content.includes(query)) {
    score += 30;
    matchedPlaces.add("Content");
  }

  if (userName.includes(query) || usn.includes(query)) {
    score += 25;
    matchedPlaces.add("Author");
  }

  // ── 2. Word-by-word matches ──
  let wordsInTitle = 0;
  let wordsInSubject = 0;
  let wordsInContent = 0;

  for (const word of words) {
    if (word.length <= 1 && words.length > 1) continue;

    if (title.includes(word)) {
      wordsInTitle++;
      score += 20;
      matchedPlaces.add("Topic Title");
      matchedWordSet.add(word);
    }

    if (subject.includes(word)) {
      wordsInSubject++;
      score += 15;
      matchedPlaces.add("Subject");
      matchedWordSet.add(word);
    }

    if (content.includes(word)) {
      wordsInContent++;
      score += 6;
      matchedPlaces.add("Content");
      matchedWordSet.add(word);
    }

    if (userName.includes(word) || usn.includes(word)) {
      score += 10;
      matchedPlaces.add("Author");
      matchedWordSet.add(word);
    }
  }

  // If query consists only of 1-letter words, fallback:
  if (matchedWordSet.size === 0) {
    for (const word of words) {
      if (title.includes(word)) {
        score += 10;
        matchedPlaces.add("Topic Title");
        matchedWordSet.add(word);
      }
      if (subject.includes(word)) {
        score += 8;
        matchedPlaces.add("Subject");
        matchedWordSet.add(word);
      }
      if (content.includes(word)) {
        score += 4;
        matchedPlaces.add("Content");
        matchedWordSet.add(word);
      }
    }
  }

  // ── 3. Sentence Coverage Bonus (Most matching topics on top) ──
  const validWords = words.filter((w) => w.length > 1);
  const targetWordsCount = validWords.length > 0 ? validWords.length : words.length;
  const coverageRatio = matchedWordSet.size / targetWordsCount;
  score += Math.round(coverageRatio * 60);

  // If ALL words in the user's sentence matched across title, subject, content
  if (matchedWordSet.size >= targetWordsCount && targetWordsCount > 1) {
    score += 60;
  }

  // If multiple words matched in title
  if (wordsInTitle > 1) {
    score += wordsInTitle * 12;
  }

  return {
    ...topic,
    matchScore: score,
    matchedIn: Array.from(matchedPlaces),
    matchedKeywords: Array.from(matchedWordSet),
  };
}
