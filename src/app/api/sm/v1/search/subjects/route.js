import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMSubject from "@/models/SMSubject";
import SMCourse from "@/models/SMCourse";
import SMCollege from "@/models/SMCollege";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const rawQuery = q.trim();
        const cleanQuery = rawQuery.toLowerCase();
        const words = cleanQuery.split(/\s+/).filter(Boolean);

        let query = {};
        if (words.length > 0) {
            // Find courses matching any of the words
            const courseOr = words.map(w => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
            const matchingCourses = await SMCourse.find({ $or: courseOr }).select("_id").lean();
            const courseIds = matchingCourses.map(c => c._id);

            // Find colleges matching any of the words
            const collegeOr = words.flatMap(w => {
                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                return [
                    { name: { $regex: escaped, $options: "i" } },
                    { location: { $regex: escaped, $options: "i" } }
                ];
            });
            const matchingColleges = await SMCollege.find({ $or: collegeOr }).select("_id").lean();
            const collegeIds = matchingColleges.map(c => c._id);

            const subjectOr = words.map(w => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));

            if (courseIds.length > 0) {
                subjectOr.push({ course: { $in: courseIds } });
            }
            if (collegeIds.length > 0) {
                subjectOr.push({ college: { $in: collegeIds } });
            }

            query = { $or: subjectOr };
        }

        const allRecords = await SMSubject.find(query)
            .populate("college")
            .populate("course")
            .populate("sem")
            .populate("batch")
            .lean();

        let scoredRecords = allRecords;
        if (words.length > 0) {
            scoredRecords = allRecords
                .map(r => {
                    let score = 0;
                    const subjectName = (r.name || "").toLowerCase();
                    const courseName = (r.course?.name || "").toLowerCase();
                    const collegeName = (r.college?.name || "").toLowerCase();
                    const fullCombinedText = `${subjectName} ${courseName} ${collegeName}`;

                    // Exact full phrase match bonus
                    if (subjectName.includes(cleanQuery)) {
                        score += 20;
                    }
                    if (subjectName.startsWith(cleanQuery)) {
                        score += 10;
                    }

                    // Score each individual word match
                    for (const word of words) {
                        if (subjectName.includes(word)) {
                            score += 5;
                        } else if (courseName.includes(word) || collegeName.includes(word)) {
                            score += 2;
                        }
                    }

                    return { r, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score || (a.r.name || "").localeCompare(b.r.name || ""))
                .map(item => item.r);
        } else {
            scoredRecords.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }

        const total = scoredRecords.length;
        const records = scoredRecords.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
