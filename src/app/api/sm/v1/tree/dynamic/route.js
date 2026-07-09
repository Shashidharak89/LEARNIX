export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMUniversity from "@/models/SMUniversity";
import SMCollege from "@/models/SMCollege";
import SMCourse from "@/models/SMCourse";
import SMSemester from "@/models/SMSemester";
import SMBatch from "@/models/SMBatch";
import SMSubject from "@/models/SMSubject";
import SMFiles from "@/models/SMFiles";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const level = url.searchParams.get("level");
        
        if (level === "universities") {
            const data = await SMUniversity.find({}).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "colleges") {
            const universityId = url.searchParams.get("universityId");
            const data = await SMCollege.find({ university: universityId }).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "courses") {
            const collegeId = url.searchParams.get("collegeId");
            const subjects = await SMSubject.find({ college: collegeId }).select("course").lean();
            const courseIds = [...new Set(subjects.map(s => s.course.toString()))];
            const data = await SMCourse.find({ _id: { $in: courseIds } }).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "semesters") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const subjects = await SMSubject.find({ college: collegeId, course: courseId }).select("sem").lean();
            const semIds = [...new Set(subjects.map(s => s.sem.toString()))];
            const data = await SMSemester.find({ _id: { $in: semIds } }).sort({ sem: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "batches") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const semesterId = url.searchParams.get("semesterId");
            
            const subjects = await SMSubject.find({ college: collegeId, course: courseId, sem: semesterId }).select("batch").lean();
            const batchIds = [...new Set(subjects.map(s => s.batch?.toString()).filter(Boolean))];
            
            const data = await SMBatch.find({ _id: { $in: batchIds } }).sort({ startyear: -1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "subjects") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const semesterId = url.searchParams.get("semesterId");
            const batchId = url.searchParams.get("batchId");
            
            const data = await SMSubject.find({ 
                college: collegeId, 
                course: courseId, 
                sem: semesterId,
                batch: batchId
            }).sort({ createdAt: 1 }).lean();
            
            return NextResponse.json({ success: true, data }, { status: 200 });
        }

        if (level === "files") {
            const subjectId = url.searchParams.get("subjectId");
            
            const data = await SMFiles.find({ sub: subjectId }).populate("sub").lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }

        return NextResponse.json({ success: false, error: "Invalid level" }, { status: 400 });

    } catch (error) {
        console.error("GET Dynamic SM Tree Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
