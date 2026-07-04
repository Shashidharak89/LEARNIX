import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";
import QPSubjects from "@/models/QPSubjects";
import QPColleges from "@/models/QPColleges";
import QPUniversities from "@/models/QPUniversities";
import QPCourse from "@/models/QPCourse";
import QPSemesters from "@/models/QPSemesters";

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

        // Grouping: University -> College -> Course -> Semester -> Subject -> Images
        const tree = {};

        for (const img of qpImages) {
            if (!img.college || !img.college.university || !img.subject || !img.subject.course || !img.subject.semester) continue;

            const uniName = img.college.university.name;
            const collName = img.college.name;
            const courseName = img.subject.course.name;
            const semName = `Semester ${img.subject.semester.semesterNumber}`;
            const subName = img.subject.name;

            if (!tree[uniName]) tree[uniName] = {};
            if (!tree[uniName][collName]) tree[uniName][collName] = {};
            if (!tree[uniName][collName][courseName]) tree[uniName][collName][courseName] = {};
            if (!tree[uniName][collName][courseName][semName]) tree[uniName][collName][courseName][semName] = {};
            if (!tree[uniName][collName][courseName][semName][subName]) tree[uniName][collName][courseName][semName][subName] = [];

            tree[uniName][collName][courseName][semName][subName].push({
                batch: img.batch ? `${img.batch.startYear}-${img.batch.endYear}` : 'Unknown',
                examType: img.examtype ? img.examtype.name : 'Unknown',
                images: img.imageUrls || [],
                id: img._id
            });
        }

        return NextResponse.json({ success: true, tree }, { status: 200 });
    } catch (error) {
        console.error("GET QP Tree Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
