import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMCollege from "@/models/SMCollege";
import SMUniversity from "@/models/SMUniversity";

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
            const uniConditions = [];
            words.forEach(w => {
                const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                uniConditions.push({ name: { $regex: esc, $options: "i" } }, { keywords: { $regex: esc, $options: "i" } });
            });
            const matchingUnis = await SMUniversity.find({ $or: uniConditions }).select("_id").lean();
            const uniIds = matchingUnis.map(u => u._id);

            const orConditions = [];
            words.forEach(w => {
                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                orConditions.push(
                    { name: { $regex: escaped, $options: "i" } },
                    { location: { $regex: escaped, $options: "i" } },
                    { keywords: { $regex: escaped, $options: "i" } }
                );
            });
            if (uniIds.length > 0) {
                orConditions.push({ university: { $in: uniIds } });
            }
            query = { $or: orConditions };
        }

        const allRecords = await SMCollege.find(query).populate("university").lean();

        let scoredRecords = allRecords;
        if (words.length > 0) {
            scoredRecords = allRecords
                .map(r => {
                    let score = 0;
                    const collegeName = (r.name || "").toLowerCase();
                    const location = (r.location || "").toLowerCase();
                    const uniName = (r.university?.name || "").toLowerCase();
                    const kwText = Array.isArray(r.keywords) ? r.keywords.join(" ").toLowerCase() : "";
                    const text = `${collegeName} ${location} ${uniName} ${kwText}`;

                    if (text.includes(cleanQuery)) score += 20;
                    if (collegeName.startsWith(cleanQuery)) score += 10;
                    if (kwText.includes(cleanQuery)) score += 15;

                    for (const word of words) {
                        if (collegeName.includes(word)) {
                            score += 5;
                        } else if (kwText.includes(word)) {
                            score += 8;
                        } else if (location.includes(word) || uniName.includes(word)) {
                            score += 2;
                        }
                    }
                    const { keywords, ...sanitized } = r;
                    if (sanitized.university && sanitized.university.keywords) {
                        const { keywords: uKw, ...uRest } = sanitized.university;
                        sanitized.university = uRest;
                    }
                    return { r: sanitized, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score || (a.r.name || "").localeCompare(b.r.name || ""))
                .map(item => item.r);
        } else {
            scoredRecords = allRecords.map(r => {
                const { keywords, ...sanitized } = r;
                if (sanitized.university && sanitized.university.keywords) {
                    const { keywords: uKw, ...uRest } = sanitized.university;
                    sanitized.university = uRest;
                }
                return sanitized;
            });
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
