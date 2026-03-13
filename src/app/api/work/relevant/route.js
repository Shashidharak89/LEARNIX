import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

const HF_SEARCH_URL = "https://shashidharak99-keyword-search-lernix.hf.space/search";
const PAGE_SIZE = 8;

/**
 * GET /api/work/relevant?q=QUERY&page=1
 *
 * 1. Calls HF API: GET /search?keyword=QUERY
 *    Response: { relevant: ["DSA Lab", "DSA", "DSA COMPLETE"] }
 * 2. Filters out any keyword where the search query is a substring of that keyword
 *    (those are already covered by the normal search).
 * 3. Searches DB for topics matching the remaining keywords (OR across topic/subject/content).
 * 4. Returns paginated results in the same format as /api/work/search (8 per page).
 */
export const GET = async (req) => {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    if (!q) {
      return NextResponse.json({ topics: [], total: 0, totalResults: 0, page, pageSize: PAGE_SIZE, totalPages: 0 });
    }

    // ── 1. Ask the HF model for relevant keywords ──────────────────────────
    let relevantKeywords = [];
    try {
      const hfRes = await fetch(`${HF_SEARCH_URL}?keyword=${encodeURIComponent(q)}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (hfRes.ok) {
        const hfData = await hfRes.json();
        // Response: { relevant: ["DSA Lab", "DSA", ...] }
        relevantKeywords = (hfData.relevant || []).map((kw) => kw?.trim()).filter(Boolean);
      }
    } catch (hfErr) {
      console.error("HF API error:", hfErr);
    }

    if (relevantKeywords.length === 0) {
      return NextResponse.json({ topics: [], total: 0, totalResults: 0, page, pageSize: PAGE_SIZE, totalPages: 0 });
    }

    // ── 2. Filter: drop any keyword that contains the search query as a substring ──
    // e.g. query="dsa" → "DSA Lab" contains "dsa" → skip (already in normal results)
    const qLower = q.toLowerCase();
    const filteredKeywords = relevantKeywords.filter((kw) => {
      const kwLower = kw.toLowerCase();
      // If the search keyword is a substring of the relevant keyword → skip
      if (kwLower.includes(qLower)) return false;
      return true;
    });

    if (filteredKeywords.length === 0) {
      return NextResponse.json({ topics: [], total: 0, totalResults: 0, page, pageSize: PAGE_SIZE, totalPages: 0 });
    }

    // ── 3. Query DB for topics matching any of the relevant keywords ──────────

    // For each keyword build OR conditions across topic name, content, and subject name
    // We collect subjectIds for subject-name matches first
    const subjectMatches = await Subject.find({
      subject: { $in: filteredKeywords.map((kw) => new RegExp(kw, "i")) },
    })
      .select("_id")
      .lean();
    const subjectIds = subjectMatches.map((s) => s._id);

    const orConditions = filteredKeywords.flatMap((kw) => {
      const re = new RegExp(kw, "i");
      return [{ topic: re }, { content: re }];
    });
    if (subjectIds.length > 0) {
      orConditions.push({ subjectId: { $in: subjectIds } });
    }

    const topicQuery = {
      $and: [
        { $or: [{ visibility: "public" }, { visibility: { $exists: false } }] },
        { $or: orConditions },
      ],
    };

    const total = await Topic.countDocuments(topicQuery);
    const topics = await Topic.find(topicQuery)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean();

    // ── 4. Populate subject + user details (same as normal search) ────────────
    const topicsWithDetails = await Promise.all(
      topics.map(async (topic) => {
        const subject = await Subject.findById(topic.subjectId).lean();
        const user = subject ? await User.findById(subject.userId).lean() : null;
        return {
          ...topic,
          subject: subject?.subject ?? null,
          subjectId: subject?._id ?? null,
          userName: user?.name ?? null,
          usn: user?.usn ?? null,
          profileimg: user?.profileimg ?? null,
          userId: user?._id ?? null,
        };
      })
    );

    return NextResponse.json({
      topics: topicsWithDetails,
      total,
      totalResults: total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
      keywords: filteredKeywords, // expose which keywords were used
    });
  } catch (err) {
    console.error("Relevant search error:", err);
    return NextResponse.json(
      { error: "Failed to fetch relevant results", details: err.message },
      { status: 500 }
    );
  }
};
