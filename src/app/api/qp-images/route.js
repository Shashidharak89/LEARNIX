import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        // Fetch all QPImages with populated references
        const qpImages = await QPImages.find()
            .populate("semester", "semesterNumber name")
            .populate("batch", "name year")
            .populate("examType", "name code")
            .populate("college", "name code")
            .populate("subject", "name code")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await QPImages.countDocuments();

        return NextResponse.json(
            {
                success: true,
                data: qpImages,
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
        console.error("Error fetching QPImages:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch QPImages",
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        await connectDB();

        const body = await req.json();

        // Validate required fields
        if (!body.semester || !body.batch || !body.examType || !body.subject) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing required fields"
                },
                { status: 400 }
            );
        }

        // Create new QPImages record
        const newQPImage = new QPImages(body);
        await newQPImage.save();

        const populated = await QPImages.findById(newQPImage._id)
            .populate("semester")
            .populate("batch")
            .populate("examType")
            .populate("college")
            .populate("subject")
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: "QPImage created successfully",
                data: populated
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating QPImage:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to create QPImage",
                error: error.message
            },
            { status: 500 }
        );
    }
}
