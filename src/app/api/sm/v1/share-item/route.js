import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMUniversity from "@/models/SMUniversity";
import SMCollege from "@/models/SMCollege";
import SMCourse from "@/models/SMCourse";
import SMSemester from "@/models/SMSemester";
import SMBatch from "@/models/SMBatch";
import SMSubject from "@/models/SMSubject";
import SMFiles from "@/models/SMFiles";

const subjectPopulate = [
    { path: "college", populate: { path: "university" } },
    { path: "course" },
    { path: "sem" },
    { path: "batch" },
];

const idOf = (value) => value?._id?.toString?.() || value?.toString?.() || "";
const record = (type, value) => value ? ({ id: idOf(value), type, name: value.name }) : null;

function buildPath(subject) {
    const university = subject?.college?.university;
    const college = subject?.college;
    return [
        record("university", university),
        record("college", college),
        record("course", subject?.course),
        record("semester", subject?.sem ? { ...subject.sem, name: `Semester ${subject.sem.sem}` } : null),
        record("batch", subject?.batch ? { ...subject.batch, name: `Batch ${subject.batch.startyear}-${subject.batch.endyear}` } : null),
        record("subject", subject),
    ].filter(Boolean);
}

function addPathParams(path) {
    const paramNames = {
        university: "university",
        college: "college",
        course: "course",
        semester: "semester",
        batch: "batch",
        subject: "subject",
        file: "file",
    };
    const params = {};
    return path.map((item) => {
        params[paramNames[item.type]] = item.id;
        return { ...item, params: { ...params } };
    });
}

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const ids = Object.fromEntries(["university", "college", "course", "semester", "batch", "subject", "file"].map((key) => [key, url.searchParams.get(key)]));

        if (ids.file) {
            const file = await SMFiles.findById(ids.file).populate({ path: "sub", populate: subjectPopulate }).lean();
            if (!file?.sub) return NextResponse.json({ success: false, error: "Shared file not found." }, { status: 404 });
            const ancestors = addPathParams(buildPath(file.sub));
            const item = { id: idOf(file), type: "file", name: file.name || file.fileurl.split("/").pop(), fileurl: file.fileurl, sourceType: file.type };
            return NextResponse.json({ success: true, item, itemType: "file", ancestors });
        }

        let item = null;
        let itemType = "";
        let ancestors = [];

        if (ids.subject) {
            const subject = await SMSubject.findById(ids.subject).populate(subjectPopulate).lean();
            if (!subject) return NextResponse.json({ success: false, error: "Shared folder not found." }, { status: 404 });
            const path = buildPath(subject);
            ancestors = path.slice(0, -1);
            item = subject;
            itemType = "subject";
        } else if (ids.batch) {
            const batch = await SMBatch.findById(ids.batch).lean();
            const match = await SMSubject.findOne({ college: ids.college, course: ids.course, sem: ids.semester, batch: ids.batch }).populate(subjectPopulate).lean();
            if (!batch || !match) return NextResponse.json({ success: false, error: "Shared folder not found." }, { status: 404 });
            ancestors = buildPath(match).slice(0, 4);
            item = batch;
            itemType = "batch";
        } else if (ids.semester) {
            const semester = await SMSemester.findById(ids.semester).lean();
            const match = await SMSubject.findOne({ college: ids.college, course: ids.course, sem: ids.semester }).populate(subjectPopulate).lean();
            if (!semester || !match) return NextResponse.json({ success: false, error: "Shared folder not found." }, { status: 404 });
            ancestors = buildPath(match).slice(0, 3);
            item = semester;
            itemType = "semester";
        } else if (ids.course) {
            const course = await SMCourse.findById(ids.course).lean();
            const match = await SMSubject.findOne({ college: ids.college, course: ids.course }).populate(subjectPopulate).lean();
            if (!course || !match) return NextResponse.json({ success: false, error: "Shared folder not found." }, { status: 404 });
            ancestors = buildPath(match).slice(0, 2);
            item = course;
            itemType = "course";
        } else if (ids.college) {
            const college = await SMCollege.findById(ids.college).populate("university").lean();
            if (!college) return NextResponse.json({ success: false, error: "Shared folder not found." }, { status: 404 });
            ancestors = addPathParams([record("university", college.university)].filter(Boolean));
            item = college;
            itemType = "college";
        } else if (ids.university) {
            item = await SMUniversity.findById(ids.university).lean();
            if (!item) return NextResponse.json({ success: false, error: "Shared folder not found." }, { status: 404 });
            itemType = "university";
        } else {
            return NextResponse.json({ success: false, error: "A shared folder or file is required." }, { status: 400 });
        }

        const itemRecord = {
            ...item,
            _id: idOf(item),
            ...(itemType === "semester" ? { name: `Semester ${item.sem}` } : {}),
            ...(itemType === "batch" ? { name: `Batch ${item.startyear}-${item.endyear}` } : {}),
        };
        return NextResponse.json({ success: true, item: itemRecord, itemType, ancestors });
    } catch (error) {
        console.error("Study materials share lookup failed:", error);
        return NextResponse.json({ success: false, error: "Could not load this shared study material." }, { status: 500 });
    }
}
