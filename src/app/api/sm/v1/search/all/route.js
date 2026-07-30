import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMUniversity from "@/models/SMUniversity";
import SMCollege from "@/models/SMCollege";
import SMCourse from "@/models/SMCourse";
import SMSubject from "@/models/SMSubject";

const searchConfigs = [
    { model: SMUniversity, name: "university", fields: ["name", "city", "district"] },
    { model: SMCollege, name: "college", fields: ["name", "location"] },
    { model: SMCourse, name: "course", fields: ["name"] },
    { model: SMSubject, name: "subject", fields: ["name"] }
];

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
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
                const text = fields.map(f => r[f] || "").join(" ").toLowerCase();
                for (const word of words) {
                    if (text.includes(word)) {
                        score += 1;
                    }
                }
                return { ...r, __type: name, __score: score };
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
