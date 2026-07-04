import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";
import QPSubjects from "@/models/QPSubjects";
import QPColleges from "@/models/QPColleges";
import QPUniversities from "@/models/QPUniversities";
import QPCourse from "@/models/QPCourse";
import QPSemesters from "@/models/QPSemesters";
import QPBatches from "@/models/QPBatches";
import QPExamType from "@/models/QPExamType";

export async function GET() {
    try {
        await connectDB();
        
        const qpImages = await QPImages.find()
            .populate({
                path: 'subject',
                populate: [
                    { path: 'course', model: 'QPCourse' },
                    { path: 'semester', model: 'QPSemesters' }
                ]
            })
            .populate({
                path: 'college',
                populate: { path: 'university', model: 'QPUniversities' }
            })
            .populate('batch')
            .populate('examtype')
            .lean();

        // Grouping: University -> College -> Course -> Batch -> Semester -> Exam Type
        const tree = {};

        for (const img of qpImages) {
            if (!img.college || !img.college.university || !img.subject || !img.subject.course || !img.subject.semester || !img.batch || !img.examtype) continue;

            const uniName = img.college.university.name;
            const collName = img.college.name;
            const courseName = img.subject.course.name;
            const batchName = `${img.batch.startYear}-${img.batch.endYear}`;
            const semName = `Semester ${img.subject.semester.semesterNumber}`;
            const examName = img.examtype.name;

            if (!tree[uniName]) tree[uniName] = {};
            if (!tree[uniName][collName]) tree[uniName][collName] = {};
            if (!tree[uniName][collName][courseName]) tree[uniName][collName][courseName] = {};
            if (!tree[uniName][collName][courseName][semName]) tree[uniName][collName][courseName][semName] = {};
            if (!tree[uniName][collName][courseName][semName][batchName]) tree[uniName][collName][courseName][semName][batchName] = {};
            
            // Only add if it doesn't already exist to prevent duplicates for the same examType
            if (!tree[uniName][collName][courseName][semName][batchName][examName]) {
                tree[uniName][collName][courseName][semName][batchName][examName] = {
                    isLeaf: true,
                    collegeId: img.college._id,
                    courseId: img.subject.course._id,
                    semesterId: img.subject.semester._id,
                    batchId: img.batch._id,
                    examTypeId: img.examtype._id
                };
            }
        }

        return NextResponse.json({ success: true, tree }, { status: 200 });
    } catch (error) {
        console.error("GET QP Tree Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
