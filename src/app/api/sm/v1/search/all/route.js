import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMUniversity from "@/models/SMUniversity";
import SMCollege from "@/models/SMCollege";
import SMCourse from "@/models/SMCourse";
import SMSubject from "@/models/SMSubject";
import { recordSearchEvent } from "@/lib/searchTracker";

const searchConfigs = [
    { model: SMUniversity, name: "university", fields: ["name", "city", "district", "keywords"] },
    { model: SMCollege, name: "college", fields: ["name", "location", "keywords"] },
    { model: SMCourse, name: "course", fields: ["name", "keywords"] },
    { model: SMSubject, name: "subject", fields: ["name", "keywords"] }
];

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const rawQuery = q.trim();
        if (rawQuery) {
            recordSearchEvent(rawQuery, "study-materials", req);
        }
        const cleanQuery = rawQuery.toLowerCase();
        const words = cleanQuery.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            return NextResponse.json({ success: true, pagination: { total: 0, page, limit, totalPages: 0 }, data: [] }, { status: 200 });
        }

        // Search all collections concurrently
        const searchPromises = searchConfigs.map(async ({ model, name, fields }) => {
            const orConditions = [];
            words.forEach(w => {
                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                fields.forEach(field => {
                    orConditions.push({ [field]: { $regex: escaped, $options: "i" } });
                });
            });
            const query = { $or: orConditions };
            
            const results = await model.find(query).lean();
            return results.map(r => {
                let score = 0;
                const kwText = Array.isArray(r.keywords) ? r.keywords.join(" ").toLowerCase() : "";
                const textFields = fields.filter(f => f !== "keywords").map(f => r[f] || "").join(" ").toLowerCase();
                const text = `${textFields} ${kwText}`;
                const primaryName = (r.name || "").toLowerCase();

                if (text.includes(cleanQuery)) score += 20;
                if (primaryName.startsWith(cleanQuery)) score += 10;
                if (kwText.includes(cleanQuery)) score += 15;

                for (const word of words) {
                    if (primaryName.includes(word)) {
                        score += 5;
                    } else if (kwText.includes(word)) {
                        score += 8;
                    } else if (text.includes(word)) {
                        score += 3;
                    }
                }
                const { keywords, ...sanitizedRecord } = r;
                return { ...sanitizedRecord, __type: name, __score: score };
            }).filter(r => r.__score > 0);
        });

        const nestedResults = await Promise.all(searchPromises);
        
        // Flatten and sort by match score desc, then by createdAt desc
        let allResults = nestedResults.flat();
        allResults.sort((a, b) => (b.__score - a.__score) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
        
        const total = allResults.length;
        const paginatedResults = allResults.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: paginatedResults
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
