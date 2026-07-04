import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPCourse from "@/models/QPCourse";
import QPSemesters from "@/models/QPSemesters";
import QPBatches from "@/models/QPBatches";
import QPExamType from "@/models/QPExamType";
import QPSubjects from "@/models/QPSubjects";
import QPImages from "@/models/QPImages";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const level = url.searchParams.get("level");
        
        if (level === "universities") {
            const data = await QPUniversities.find({}).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "colleges") {
            const universityId = url.searchParams.get("universityId");
            const data = await QPColleges.find({ university: universityId }).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "courses") {
            const collegeId = url.searchParams.get("collegeId");
            const subjects = await QPSubjects.find({ college: collegeId }).select("course").lean();
            const courseIds = [...new Set(subjects.map(s => s.course.toString()))];
            const data = await QPCourse.find({ _id: { $in: courseIds } }).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "semesters") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const subjects = await QPSubjects.find({ college: collegeId, course: courseId }).select("semester").lean();
            const semIds = [...new Set(subjects.map(s => s.semester.toString()))];
            const data = await QPSemesters.find({ _id: { $in: semIds } }).sort({ semesterNumber: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "batches") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const semesterId = url.searchParams.get("semesterId");
            
            const subjects = await QPSubjects.find({ college: collegeId, course: courseId, semester: semesterId }).select("_id").lean();
            const subjectIds = subjects.map(s => s._id);
            
            const images = await QPImages.find({ subject: { $in: subjectIds } }).select("batch").lean();
            const batchIds = [...new Set(images.map(img => img.batch?.toString()).filter(Boolean))];
            
            const data = await QPBatches.find({ _id: { $in: batchIds } }).sort({ startYear: -1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }
        
        if (level === "exams") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const semesterId = url.searchParams.get("semesterId");
            const batchId = url.searchParams.get("batchId");
            
            const subjects = await QPSubjects.find({ college: collegeId, course: courseId, semester: semesterId }).select("_id").lean();
            const subjectIds = subjects.map(s => s._id);
            
            const images = await QPImages.find({ subject: { $in: subjectIds }, batch: batchId }).select("examtype").lean();
            const examIds = [...new Set(images.map(img => img.examtype?.toString()).filter(Boolean))];
            
            const data = await QPExamType.find({ _id: { $in: examIds } }).sort({ name: 1 }).lean();
            return NextResponse.json({ success: true, data }, { status: 200 });
        }

        if (level === "images") {
            const collegeId = url.searchParams.get("collegeId");
            const courseId = url.searchParams.get("courseId");
            const semesterId = url.searchParams.get("semesterId");
            const batchId = url.searchParams.get("batchId");
            const examId = url.searchParams.get("examId");
            
            const subjects = await QPSubjects.find({ college: collegeId, course: courseId, semester: semesterId }).select("_id name").lean();
            const subjectIds = subjects.map(s => s._id);
            
            // We fetch the images, and map them with their subject name so we can render them properly
            const images = await QPImages.find({ 
                subject: { $in: subjectIds }, 
                batch: batchId,
                examtype: examId
            }).populate("subject").lean();
            
            return NextResponse.json({ success: true, data: images }, { status: 200 });
        }

        return NextResponse.json({ success: false, error: "Invalid level" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
