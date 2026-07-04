import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPSemesters from "@/models/QPSemesters";
import QPExamType from "@/models/QPExamType";
import QPBatches from "@/models/QPBatches";
import QPSubjects from "@/models/QPSubjects";

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "all";

        let result = {};

        if (type === "all" || type === "universities") {
            result.universities = await QPUniversities.find({ isActive: true });
        }

        if (type === "all" || type === "colleges") {
            result.colleges = await QPColleges.find({ isActive: true })
                .populate("university", "name code");
        }

        if (type === "all" || type === "semesters") {
            result.semesters = await QPSemesters.find({ isActive: true });
        }

        if (type === "all" || type === "examTypes") {
            result.examTypes = await QPExamType.find({ isActive: true });
        }

        if (type === "all" || type === "batches") {
            result.batches = await QPBatches.find({ isActive: true });
        }

        if (type === "all" || type === "subjects") {
            result.subjects = await QPSubjects.find({ isActive: true })
                .populate("semester", "name semesterNumber")
                .populate("college", "name code");
        }

        return NextResponse.json(
            {
                success: true,
                data: result
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching QP data:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch QP data",
                error: error.message
            },
            { status: 500 }
        );
    }
}
