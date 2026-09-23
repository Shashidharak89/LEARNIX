import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Update from "@/models/Update";
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

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // 1. Works (Topic model)
    let worksItems = [];
    let worksCount = 0;
    try {
      await connectDB();
      const topics = await Topic.find({
        $or: [{ topic: regex }, { content: regex }],
        visibility: { $ne: "private" },
      })
        .sort({ timestamp: -1 })
        .limit(3)
        .lean();

      worksItems = topics.map((t) => ({
        _id: String(t._id),
        topic: t.topic || "Untitled Topic",
        subject: t.subjectName || "",
      }));
      worksCount = worksItems.length;
    } catch (err) {
      console.error("HeroSearch Works fetch error:", err);
    }

    // 2. Updates (Update model)
    let updatesItems = [];
    let updatesCount = 0;
    try {
      await connectDB();
      const updates = await Update.find({
        $or: [{ title: regex }, { content: regex }],
        visibility: { $ne: "private" },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      updatesItems = updates.map((u) => ({
        _id: String(u._id),
        title: u.title || "Untitled Update",
        userName: u.userName || "",
      }));
      updatesCount = updatesItems.length;
    } catch (err) {
      console.error("HeroSearch Updates fetch error:", err);
    }

    // 3. Materials (materialsData static list)
    let materialsItems = [];
    let materialsCount = 0;
    try {
      const matMatches = [];
      if (Array.isArray(materialsData)) {
        for (const sem of materialsData) {
          if (!sem.subjects) continue;
          for (const sub of sem.subjects) {
            const subName = sub.name || sub.subject || "";
            const matchesSub = regex.test(subName);
            const matchingFiles = (sub.files || []).filter((f) => regex.test(f.name || f.url || ""));

            if (matchesSub || matchingFiles.length > 0) {
              matMatches.push({
                subject: subName,
                semester: sem.semesterLabel || `Semester ${sem.semester || ""}`,
                fileCount: sub.files ? sub.files.length : 0,
              });
            }
          }
        }
      }
      materialsCount = matMatches.length;
      materialsItems = matMatches.slice(0, 3);
    } catch (err) {
      console.error("HeroSearch Materials error:", err);
    }

    // 4. Question Papers (listQuestionPapers)
    let qpItems = [];
    let qpCount = 0;
    try {
      const qpResults = listQuestionPapers({ q });
      if (Array.isArray(qpResults)) {
        qpCount = qpResults.length;
        qpItems = qpResults.slice(0, 3).map((paper) => ({
          id: paper.id,
          semesterLabel: paper.semesterLabel || `Semester ${paper.semester}`,
          batch: paper.batch,
          examType: paper.examType,
          totalSubjects: paper.totalSubjects || (paper.subjects ? paper.subjects.length : 0),
        }));
      }
    } catch (err) {
      console.error("HeroSearch QuestionPapers error:", err);
    }

    // 5. Matching pages/shortcuts
    const matchingPages = PAGES.filter((p) => {
      const qLower = q.toLowerCase();
      if (p.name.toLowerCase().includes(qLower)) return true;
      return p.keywords.some((k) => k.includes(qLower) || qLower.includes(k));
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
