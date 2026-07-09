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

        if (!q) {
            return NextResponse.json({ success: true, pagination: { total: 0, page, limit, totalPages: 0 }, data: [] }, { status: 200 });
        }

        // Search all collections concurrently
        const searchPromises = searchConfigs.map(async ({ model, name, fields }) => {
            const query = {
                $or: fields.map(field => ({
                    [field]: { $regex: q, $options: "i" }
                }))
            };
            
            const results = await model.find(query).sort({ createdAt: -1 }).lean();
            return results.map(r => ({ ...r, __type: name }));
        });

        const nestedResults = await Promise.all(searchPromises);
        
        // Flatten and sort by latest globally
        let allResults = nestedResults.flat();
        allResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
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
