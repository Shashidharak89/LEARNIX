import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPSemesters from "@/models/QPSemesters";
import QPExamType from "@/models/QPExamType";
import QPBatches from "@/models/QPBatches";
import QPSubjects from "@/models/QPSubjects";
import QPImages from "@/models/QPImages";
import QPCourse from "@/models/QPCourse";

const models = {
    QPUniversities,
    QPColleges,
    QPSemesters,
    QPExamType,
    QPBatches,
    QPSubjects,
    QPImages,
    QPCourse
};

function normalizeKeywords(keywords) {
    if (!keywords) return [];
    if (typeof keywords === "string") {
        return Array.from(new Set(
            keywords.split(",")
                .map(k => k.trim())
                .filter(k => k.length > 0)
        ));
    }
    if (Array.isArray(keywords)) {
        return Array.from(new Set(
            keywords.flatMap(k => {
                if (typeof k === "string") {
                    return k.split(",").map(s => s.trim());
                }
                return String(k || "").trim();
            }).filter(k => k.length > 0)
        ));
    }
    return [];
}

// Helper to verify that the request includes a valid Bearer token for an admin or superadmin
async function checkAdminAuth(req) {
    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    
    if (auth.tokenProvided && auth.tokenInvalid) {
        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, message: "Token expired or invalid. Please login again." },
                { status: 401 }
            )
        };
    }

    const caller = auth.user;
    if (!caller) {
        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, message: "Unauthorized. Authentication token is required." },
                { status: 401 }
            )
        };
    }

    const role = (caller.role || "").toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, message: "Forbidden. Admin or Super Admin privileges required." },
                { status: 403 }
            )
        };
    }

    return { authorized: true, user: caller };
}

// GET: Fetch records for a model or a specific record by ID
export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const modelName = url.searchParams.get("model");
        const id = url.searchParams.get("id");
        
        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        const Model = models[modelName];

        if (id) {
            const record = await Model.findById(id);
            if (!record) {
                return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: record }, { status: 200 });
        }

        const page = parseInt(url.searchParams.get("page"), 10) || 1;
        const limit = parseInt(url.searchParams.get("limit"), 10) || 0;

        let query = Model.find({});
        if (modelName === "QPColleges") {
            query = query.populate("university");
        } else if (modelName === "QPSubjects") {
            query = query.populate("college").populate("course").populate("semester");
        } else if (modelName === "QPImages") {
            query = query.populate("college").populate("batch").populate("examtype").populate({
                path: "subject",
                populate: [{ path: "course" }, { path: "semester" }]
            });
        }

        let data;
        let pagination = null;
        const sortQuery = { createdAt: -1 };

        if (limit > 0) {
            const skip = (page - 1) * limit;
            const total = await Model.countDocuments({});
            data = await query.sort(sortQuery).skip(skip).limit(limit);
            pagination = {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalRecords: total
            };
        } else {
            data = await query.sort(sortQuery);
        }

        return NextResponse.json({ success: true, data, pagination }, { status: 200 });
    } catch (error) {
        console.error("GET QP Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Create a new record (Admin / Super Admin only)
export async function POST(req) {
    try {
        await connectDB();
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) return auth.response;

        const body = await req.json();
        const { modelName, data } = body;

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        const Model = models[modelName];
        const prepareRecord = (rec) => {
            const copy = { ...rec };
            if (copy.keywords !== undefined) {
                copy.keywords = normalizeKeywords(copy.keywords);
            }
            return copy;
        };

        if (Array.isArray(data)) {
            const cleanedData = data.map(prepareRecord);
            const newRecords = await Model.insertMany(cleanedData);
            return NextResponse.json({
                success: true,
                message: `${modelName.replace("QP", "")} created successfully`,
                data: newRecords
            }, { status: 201 });
        } else {
            const cleanedRecord = prepareRecord(data);
            const newRecord = new Model(cleanedRecord);
            await newRecord.save();

            return NextResponse.json({
                success: true,
                message: `${modelName.replace("QP", "")} created successfully`,
                data: newRecord
            }, { status: 201 });
        }
    } catch (error) {
        console.error("POST QP Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT: Update an existing record (Admin / Super Admin only)
export async function PUT(req) {
    try {
        await connectDB();
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) return auth.response;

        const url = new URL(req.url);
        const body = await req.json().catch(() => ({}));

        const modelName = body.modelName || url.searchParams.get("model");
        const id = body.id || url.searchParams.get("id");
        const data = body.data || body;

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ success: false, message: "Record ID is required" }, { status: 400 });
        }

        // Clean up data to avoid mutating system fields
        const updateData = { ...data };
        delete updateData._id;
        delete updateData.id;
        delete updateData.modelName;

        if (updateData.keywords !== undefined) {
            updateData.keywords = normalizeKeywords(updateData.keywords);
        }

        const Model = models[modelName];
        const updatedRecord = await Model.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedRecord) {
            return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `${modelName.replace("QP", "")} updated successfully`,
            data: updatedRecord
        }, { status: 200 });
    } catch (error) {
        console.error("PUT QP Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Delete an existing record (Admin / Super Admin only)
export async function DELETE(req) {
    try {
        await connectDB();
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) return auth.response;

        const url = new URL(req.url);
        let modelName = url.searchParams.get("model");
        let id = url.searchParams.get("id");

        // Fallback: check JSON body if not present in searchParams
        if (!modelName || !id) {
            try {
                const body = await req.json();
                modelName = modelName || body.modelName;
                id = id || body.id;
            } catch {
                // No body provided
            }
        }

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ success: false, message: "Record ID is required" }, { status: 400 });
        }

        const Model = models[modelName];
        const deletedRecord = await Model.findByIdAndDelete(id);

        if (!deletedRecord) {
            return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `${modelName.replace("QP", "")} deleted successfully`,
            data: deletedRecord
        }, { status: 200 });
    } catch (error) {
        console.error("DELETE QP Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
