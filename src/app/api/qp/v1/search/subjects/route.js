import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPSubjects from "@/models/QPSubjects";
import { recordSearchEvent } from "@/lib/searchTracker";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const rawQuery = q.trim();
        if (rawQuery) {
            recordSearchEvent(rawQuery, "question-papers", req);
        }

        const cleanQuery = rawQuery.toLowerCase();
        const words = cleanQuery.split(/\s+/).filter(Boolean);
        let query = {};
        if (words.length > 0) {
            const orConditions = [];
            words.forEach(w => {
                const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                orConditions.push({ name: { $regex: esc, $options: "i" } }, { keywords: { $regex: esc, $options: "i" } });
            });
            query = { $or: orConditions };
        }

        const allRecords = await QPSubjects.find(query).lean();

        let scoredRecords = allRecords;
        if (words.length > 0) {
            scoredRecords = allRecords
                .map(r => {
                    let score = 0;
                    const text = (r.name || "").toLowerCase();
                    const kwText = Array.isArray(r.keywords) ? r.keywords.join(" ").toLowerCase() : "";
                    if (text.includes(cleanQuery)) score += 20;
                    if (text.startsWith(cleanQuery)) score += 10;
                    if (kwText.includes(cleanQuery)) score += 15;
                    for (const word of words) {
                        if (text.includes(word)) {
                            score += 5;
                        } else if (kwText.includes(word)) {
                            score += 8;
                        }
                    }
                    const { keywords, ...sanitized } = r;
                    return { r: sanitized, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score || new Date(b.r.createdAt || 0) - new Date(a.r.createdAt || 0))
                .map(item => item.r);
        } else {
            scoredRecords = allRecords.map(({ keywords, ...rest }) => rest);
            scoredRecords.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
