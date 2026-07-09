import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMFiles from "@/models/SMFiles";
import SMSubject from "@/models/SMSubject";
import SMCollege from "@/models/SMCollege";
import SMUniversity from "@/models/SMUniversity";
import SMCourse from "@/models/SMCourse";
import SMSemester from "@/models/SMSemester";
import SMBatch from "@/models/SMBatch";

export async function GET() {
    try {
        await connectDB();
        
        const smFiles = await SMFiles.find()
            .populate({
                path: 'sub',
                populate: [
                    { path: 'course', model: 'SMCourse' },
                    { path: 'sem', model: 'SMSemester' },
                    { path: 'batch', model: 'SMBatch' },
                    { 
                        path: 'college', 
                        model: 'SMCollege',
                        populate: { path: 'university', model: 'SMUniversity' }
                    }
                ]
            })
            .lean();

        // Grouping: University -> College -> Course -> Semester -> Batch -> Files
        const tree = {};

        for (const file of smFiles) {
            if (!file.sub || !file.sub.college || !file.sub.college.university || !file.sub.course || !file.sub.sem || !file.sub.batch) continue;

            const uniName = file.sub.college.university.name;
            const collName = file.sub.college.name;
            const courseName = file.sub.course.name;
            const semName = `Semester ${file.sub.sem.sem}`;
            const batchName = `${file.sub.batch.startyear}-${file.sub.batch.endyear}`;

            if (!tree[uniName]) tree[uniName] = {};
            if (!tree[uniName][collName]) tree[uniName][collName] = {};
            if (!tree[uniName][collName][courseName]) tree[uniName][collName][courseName] = {};
            if (!tree[uniName][collName][courseName][semName]) tree[uniName][collName][courseName][semName] = {};
            if (!tree[uniName][collName][courseName][semName][batchName]) tree[uniName][collName][courseName][semName][batchName] = {};

            if (!tree[uniName][collName][courseName][semName][batchName][file.sub.name]) {
                tree[uniName][collName][courseName][semName][batchName][file.sub.name] = {
                    isLeaf: true,
                    collegeId: file.sub.college._id,
                    courseId: file.sub.course._id,
                    semesterId: file.sub.sem._id,
                    batchId: file.sub.batch._id,
                    subjectId: file.sub._id
                };
            }
        }

        return NextResponse.json({ success: true, tree }, { status: 200 });
    } catch (error) {
        console.error("GET SM Tree Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
