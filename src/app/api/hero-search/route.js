import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Update from "@/models/Update";
import QPSubjects from "@/models/QPSubjects";
import materialsData from "@/app/materials/materialsData";
import { listQuestionPapers } from "@/app/api/question-papers/store";

const PAGES = [
  { name: "Works & Notes", href: "/works", icon: "FiFolder", keywords: ["work", "works", "note", "notes", "topic", "subject"] },
  { name: "Study Materials", href: "/materials", icon: "FiBookOpen", keywords: ["material", "materials", "study", "syllabus", "notes", "pdf", "file"] },
  { name: "Question Papers", href: "/qp", icon: "FiFileText", keywords: ["question", "paper", "papers", "exam", "qp", "pyq", "test", "vtu"] },
  { name: "Campus Updates", href: "/updates", icon: "FiBell", keywords: ["update", "updates", "news", "notice", "announcement"] },
  { name: "Give Feedback", href: "/feedback", icon: "FiMessageSquare", keywords: ["feedback", "contact", "support", "help", "report", "bug"] },
];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) {
      return NextResponse.json({
        works: { count: 0, items: [] },
        updates: { count: 0, items: [] },
        materials: { count: 0, items: [] },
        questionPapers: { count: 0, items: [] },
        pages: [],
      });
    }

    // Split search query into keywords by spaces
    const tokens = q
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({
        works: { count: 0, items: [] },
        updates: { count: 0, items: [] },
        materials: { count: 0, items: [] },
        questionPapers: { count: 0, items: [] },
        pages: [],
      });
    }

    // ── 1. Works (Topic model) ─────────────────────────────────────────────
    let worksItems = [];
    let worksCount = 0;
    try {
      await connectDB();
      const tokenOrs = tokens.map((token) => {
        const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return {
          $or: [{ topic: regex }, { content: regex }, { subjectName: regex }],
        };
      });

      const queryObj = {
        $or: tokenOrs,
        visibility: { $ne: "private" },
      };

      const rawTopics = await Topic.find(queryObj).lean();
      
      // Score documents by number of keyword matches
      const scoredTopics = rawTopics.map((t) => {
        let score = 0;
        const textToSearch = `${t.topic || ""} ${t.subjectName || ""} ${t.content || ""}`.toLowerCase();
        for (const token of tokens) {
          if (textToSearch.includes(token.toLowerCase())) score += 1;
        }
        return { doc: t, score };
      });

      // Sort by highest keyword matches first, then newest
      scoredTopics.sort(
        (a, b) => b.score - a.score || new Date(b.doc.timestamp || 0) - new Date(a.doc.timestamp || 0)
      );

      worksCount = scoredTopics.length;
      worksItems = scoredTopics.slice(0, 3).map(({ doc: t }) => ({
        _id: String(t._id),
        topic: t.topic || "Untitled Topic",
        subject: t.subjectName || "",
      }));
    } catch (err) {
      console.error("HeroSearch Works fetch error:", err);
    }

    // ── 2. Updates (Update model) ──────────────────────────────────────────
    let updatesItems = [];
    let updatesCount = 0;
    try {
      await connectDB();
      const tokenOrs = tokens.map((token) => {
        const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return {
          $or: [{ title: regex }, { content: regex }, { userName: regex }],
        };
      });

      const queryObj = {
        $or: tokenOrs,
        visibility: { $ne: "private" },
      };

      const rawUpdates = await Update.find(queryObj).lean();

      const scoredUpdates = rawUpdates.map((u) => {
        let score = 0;
        const textToSearch = `${u.title || ""} ${u.content || ""} ${u.userName || ""}`.toLowerCase();
        for (const token of tokens) {
          if (textToSearch.includes(token.toLowerCase())) score += 1;
        }
        return { doc: u, score };
      });

      scoredUpdates.sort(
        (a, b) => b.score - a.score || new Date(b.doc.createdAt || 0) - new Date(a.doc.createdAt || 0)
      );

      updatesCount = scoredUpdates.length;
      updatesItems = scoredUpdates.slice(0, 3).map(({ doc: u }) => ({
        _id: String(u._id),
        title: u.title || "Untitled Update",
        userName: u.userName || "",
      }));
    } catch (err) {
      console.error("HeroSearch Updates fetch error:", err);
    }

    // ── 3. Materials (materialsData static list) ───────────────────────────
    let materialsItems = [];
    let materialsCount = 0;
    try {
      const matMatches = [];
      if (Array.isArray(materialsData)) {
        for (const sem of materialsData) {
          if (!sem.subjects) continue;
          for (const sub of sem.subjects) {
            const subName = sub.name || sub.subject || "";
            const fileNames = (sub.files || []).map((f) => f.name || "").join(" ");
            const combinedText = `${subName} ${sem.semesterLabel || ""} ${fileNames}`.toLowerCase();

            let score = 0;
            for (const token of tokens) {
              if (combinedText.includes(token.toLowerCase())) score += 1;
            }

            if (score > 0) {
              matMatches.push({
                item: {
                  subject: subName,
                  semester: sem.semesterLabel || `Semester ${sem.semester || ""}`,
                  fileCount: sub.files ? sub.files.length : 0,
                },
                score,
              });
            }
          }
        }
      }
      matMatches.sort((a, b) => b.score - a.score);
      materialsCount = matMatches.length;
      materialsItems = matMatches.slice(0, 3).map((m) => m.item);
    } catch (err) {
      console.error("HeroSearch Materials error:", err);
    }

    // ── 4. Question Papers (Search Subjects by Name in DB & Papers) ───────────
    let qpItems = [];
    let qpCount = 0;
    try {
      await connectDB();
      const matchedSubjectsMap = new Map();

      // 4a. Search QPSubjects collection in MongoDB
      const tokenOrs = tokens.map((token) => ({
        name: { $regex: token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
      }));

      const rawDbSubjects = await QPSubjects.find({ $or: tokenOrs }).lean();

      for (const sub of rawDbSubjects) {
        if (!sub.name) continue;
        const subName = sub.name.trim();
        const normKey = subName.toLowerCase();
        let score = 0;
        for (const token of tokens) {
          if (normKey.includes(token.toLowerCase())) score += 1;
        }
        if (score > 0) {
          matchedSubjectsMap.set(normKey, {
            _id: String(sub._id),
            name: subName,
            title: subName,
            score,
          });
        }
      }

      // 4b. Cross-reference with listQuestionPapers for paper subjects
      const qpResults = await listQuestionPapers({ q });
      if (Array.isArray(qpResults)) {
        for (const paper of qpResults) {
          if (!Array.isArray(paper.subjects)) continue;
          for (const subItem of paper.subjects) {
            const subName = String(subItem.subject || "").trim();
            if (!subName) continue;
            const normKey = subName.toLowerCase();

            let score = 0;
            for (const token of tokens) {
              if (normKey.includes(token.toLowerCase())) score += 1;
            }

            if (score > 0) {
              if (!matchedSubjectsMap.has(normKey)) {
                matchedSubjectsMap.set(normKey, {
                  _id: paper.id ? `${paper.id}_${normKey}` : null,
                  name: subName,
                  title: subName,
                  score,
                });
              } else {
                const existing = matchedSubjectsMap.get(normKey);
                existing.score = Math.max(existing.score, score) + 1;
              }
            }
          }
        }
      }

      const allMatchedSubjects = Array.from(matchedSubjectsMap.values());
      allMatchedSubjects.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

      // The count is the total number of subjects found matching the query
      qpCount = allMatchedSubjects.length;
      qpItems = allMatchedSubjects.slice(0, 3).map((sub) => ({
        _id: sub._id,
        name: sub.name,
        title: sub.name,
      }));
    } catch (err) {
      console.error("HeroSearch QuestionPapers error:", err);
    }

    // ── 5. Matching pages/shortcuts ─────────────────────────────────────────
    const matchingPages = PAGES.filter((p) => {
      const pageText = `${p.name} ${p.keywords.join(" ")}`.toLowerCase();
      return tokens.some((token) => pageText.includes(token.toLowerCase()));
    }).map(({ name, href, icon }) => ({ name, href, icon }));

    return NextResponse.json({
      works: { count: worksCount, items: worksItems },
      updates: { count: updatesCount, items: updatesItems },
      materials: { count: materialsCount, items: materialsItems },
      questionPapers: { count: qpCount, items: qpItems },
      pages: matchingPages,
    });
  } catch (error) {
    console.error("HeroSearch GET route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
