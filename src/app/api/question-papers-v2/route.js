import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import QuestionPaperV2 from "@/models/QuestionPaperV2";

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        // Optional filters
        const subjectId = searchParams.get("subject");
        const semesterId = searchParams.get("semester");
        const collegeId = searchParams.get("college");
        const examTypeId = searchParams.get("examType");
        const batchId = searchParams.get("batch");

        const filter = { isPublished: true };

        if (subjectId) filter.subject = subjectId;
        if (semesterId) filter.semester = semesterId;
        if (collegeId) filter.college = collegeId;
        if (examTypeId) filter.examType = examTypeId;
        if (batchId) filter.batch = batchId;

        const total = await QuestionPaperV2.countDocuments(filter);
        const questionPapers = await QuestionPaperV2.find(filter)
            .populate("university", "name code")
            .populate("college", "name code")
            .populate("subject", "name code")
            .populate("semester", "name semesterNumber")
            .populate("examType", "name code")
            .populate("batch", "name year")
            .populate("uploadedBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        // Format references: convert null/undefined to "NA"
        const formatted = questionPapers.map((qp) => {
            const doc = qp.toObject();
            const referenceFields = ["university", "college", "subject", "semester", "examType", "batch", "uploadedBy"];
            referenceFields.forEach((field) => {
                if (!doc[field]) {
                    doc[field] = "NA";
                }
            });
            return doc;
        });

        return NextResponse.json(
            {
                success: true,
                data: formatted,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching question papers:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch question papers",
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        await connectDB();

        const user = await resolveAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            title,
            university,
            college,
            subject,
            semester,
            examType,
            batch,
            fileUrl,
            fileName,
            totalQuestions,
            difficulty
        } = body;

        if (!title) {
            return NextResponse.json(
                { success: false, message: "Title is required" },
                { status: 400 }
            );
        }

        const newQP = new QuestionPaperV2({
            title,
            university: university || null,
            college: college || null,
            subject: subject || null,
            semester: semester || null,
            examType: examType || null,
            batch: batch || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            totalQuestions: totalQuestions || 0,
            difficulty: difficulty || "Medium",
            uploadedBy: user._id,
            isPublished: false
        });

        await newQP.save();

        const populated = await newQP.populate([
            { path: "universe", select: "name code" },
            { path: "college", select: "name code" },
            { path: "subject", select: "name code" },
            { path: "semester", select: "name semesterNumber" },
            { path: "examType", select: "name code" },
            { path: "batch", select: "name year" },
            { path: "uploadedBy", select: "name email" }
        ]);

        const doc = populated.toObject();
        const referenceFields = ["university", "college", "subject", "semester", "examType", "batch", "uploadedBy"];
        referenceFields.forEach((field) => {
            if (!doc[field]) {
                doc[field] = "NA";
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: "Question paper created successfully",
                data: doc
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating question paper:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to create question paper",
                error: error.message
            },
            { status: 500 }
        );
    }
}
