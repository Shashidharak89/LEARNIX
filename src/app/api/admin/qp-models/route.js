import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPSemesters from "@/models/QPSemesters";
import QPExamType from "@/models/QPExamType";
import QPBatches from "@/models/QPBatches";
import QPSubjects from "@/models/QPSubjects";
import QPImages from "@/models/QPImages";

const models = {
    QPUniversities,
    QPColleges,
    QPSemesters,
    QPExamType,
    QPBatches,
    QPSubjects,
    QPImages
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
        const data = await Model.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("GET QP Model Error:", error);
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
        const newRecord = new Model(data);
        await newRecord.save();

        return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
    } catch (error) {
        console.error("POST QP Model Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
