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

// GET /api/admin/qp-models/[id]?model=...
export async function GET(req, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const url = new URL(req.url);
        const modelName = url.searchParams.get("model");

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        const Model = models[modelName];
        const record = await Model.findById(id);

        if (!record) {
            return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: record }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT /api/admin/qp-models/[id]?model=...
export async function PUT(req, { params }) {
    try {
        await connectDB();
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        const url = new URL(req.url);
        const body = await req.json().catch(() => ({}));
        const modelName = body.modelName || url.searchParams.get("model");
        const data = body.data || body;

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        const updateData = { ...data };
        delete updateData._id;
        delete updateData.id;
        delete updateData.modelName;

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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/qp-models/[id]?model=...
export async function DELETE(req, { params }) {
    try {
        await connectDB();
        const auth = await checkAdminAuth(req);
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        const url = new URL(req.url);
        let modelName = url.searchParams.get("model");

        if (!modelName) {
            try {
                const body = await req.json();
                modelName = body.modelName;
            } catch {
                // Ignore missing or invalid JSON body
            }
        }

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
