export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMUniversity from "@/models/SMUniversity";
import SMCollege from "@/models/SMCollege";
import SMCourse from "@/models/SMCourse";
import SMSemester from "@/models/SMSemester";
import SMSubject from "@/models/SMSubject";
import SMFiles from "@/models/SMFiles";
import SMBatch from "@/models/SMBatch";

const models = {
    SMUniversity,
    SMCollege,
    SMCourse,
    SMSemester,
    SMSubject,
    SMFiles,
    SMBatch
};

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const modelName = url.searchParams.get("model");
        
        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        const Model = models[modelName];

        // Read query params for pagination
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 0; // 0 means return all
        
        let query = Model.find({});
        
        // If it's a model with references, we can populate them
        if (modelName === "SMCollege") {
            query = query.populate("university");
        } else if (modelName === "SMSubject") {
            query = query.populate("college").populate("course").populate("sem").populate("batch");
        } else if (modelName === "SMFiles") {
            query = query.populate({
                path: "sub",
                populate: [{ path: "college" }, { path: "course" }, { path: "sem" }, { path: "batch" }]
            });
        }

        let data;
        let pagination = null;

        // Custom optimal sorting for models
        let sortQuery = { createdAt: -1 };

        if (limit > 0) {
            const skip = (page - 1) * limit;
            const totalRecords = await Model.countDocuments({});
            data = await query.sort(sortQuery).skip(skip).limit(limit);
            pagination = {
                page,
                limit,
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords
            };
        } else {
            data = await query.sort(sortQuery);
        }

        return NextResponse.json({ success: true, data, pagination }, { status: 200 });
    } catch (error) {
        console.error("GET SM Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const body = await req.json();
        const { modelName, data } = body;

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }

        const Model = models[modelName];

        const cleanUrl = (url) => {
            if (!url) return url;
            return url.replace(/github\.com/g, 'raw.github.com')
                      .replace(/\/blob\//g, '/')
                      .replace(/\/bolb\//g, '/');
        };

        if (modelName === "SMFiles") {
            const cleanRecord = (record) => {
                const copy = { ...record };
                if (copy.fileurl) {
                    copy.fileurl = cleanUrl(copy.fileurl);
                }
                return copy;
            };

            if (Array.isArray(data)) {
                const cleanedData = data.map(cleanRecord);
                const newRecords = await Model.insertMany(cleanedData);
                return NextResponse.json({ success: true, data: newRecords }, { status: 201 });
            } else {
                const cleanedRecord = cleanRecord(data);
                const newRecord = new Model(cleanedRecord);
                await newRecord.save();
                return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
            }
        }

        if (Array.isArray(data)) {
            const newRecords = await Model.insertMany(data);
            return NextResponse.json({ success: true, data: newRecords }, { status: 201 });
        } else {
            const newRecord = new Model(data);
            await newRecord.save();
            return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
        }
    } catch (error) {
        console.error("POST SM Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const modelName = url.searchParams.get("model");
        const id = url.searchParams.get("id");

        if (!modelName || !models[modelName]) {
            return NextResponse.json({ success: false, message: "Invalid model name" }, { status: 400 });
        }
        if (!id) {
            return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
        }

        const Model = models[modelName];
        await Model.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Record deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("DELETE SM Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
