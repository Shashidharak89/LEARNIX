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
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        if (!q.trim()) {
            return NextResponse.json({
                success: true,
                pagination: { total: 0, page, limit, totalPages: 0 },
                data: []
            }, { status: 200 });
        }

        const regex = { $regex: q, $options: "i" };

        // 1. Resolve matching IDs from all levels
        const [uniMatches, collegeMatches, courseMatches, semesters, batches, fileMatches] = await Promise.all([
            SMUniversity.find({ name: regex }).select("_id").lean(),
            SMCollege.find({ name: regex }).select("_id").lean(),
            SMCourse.find({ name: regex }).select("_id").lean(),
            SMSemester.find({}).lean(),
            SMBatch.find({}).lean(),
            SMFiles.find({
                $or: [
                    { name: regex },
                    { fileurl: regex }
                ]
            }).select("_id sub").lean()
        ]);

        const uniIds = uniMatches.map(u => u._id);
        const collegeIds = collegeMatches.map(c => c._id);
        const courseIds = courseMatches.map(c => c._id);
        const fileIds = fileMatches.map(f => f._id);
        const fileParentSubjectIds = fileMatches.map(f => f.sub);

        // Resolve semester IDs matching keyword (e.g. "1st sem" or "1")
        const semIds = semesters.filter(s => {
            const semName = `Semester ${s.sem}`.toLowerCase();
            const semShort = `${s.sem} sem`.toLowerCase();
            const semVal = String(s.sem).toLowerCase();
            const term = q.toLowerCase();
            return semName.includes(term) || semShort.includes(term) || semVal.includes(term);
        }).map(s => s._id);

        // Resolve batch IDs matching keyword (e.g. "2025" or "2025-2027")
        const batchIds = batches.filter(b => {
            const batchName = `Batch ${b.startyear}-${b.endyear}`.toLowerCase();
            const startStr = String(b.startyear);
            const endStr = String(b.endyear);
            const term = q.toLowerCase();
            return batchName.includes(term) || startStr.includes(term) || endStr.includes(term);
        }).map(b => b._id);

        // Resolve colleges under matching universities
        const collegeMatchesResolved = await SMCollege.find({
            $or: [
                { _id: { $in: collegeIds } },
                { university: { $in: uniIds } }
            ]
        }).select("_id").lean();
        const collegeIdsResolved = collegeMatchesResolved.map(c => c._id);

        // 2. Fetch all subjects that are matched or have matched children/parents
        const matchingSubjects = await SMSubject.find({
            $or: [
                { name: regex },
                { college: { $in: collegeIdsResolved } },
                { course: { $in: courseIds } },
                { sem: { $in: semIds } },
                { batch: { $in: batchIds } },
                { _id: { $in: fileParentSubjectIds } }
            ]
        })
        .populate({
            path: "college",
            populate: { path: "university" }
        })
        .populate("course")
        .populate("sem")
        .populate("batch")
        .lean();

        // Filter out subjects with broken references
        const validSubjects = matchingSubjects.filter(s => 
            s.college && s.college.university && s.course && s.sem && s.batch
        );

        // 3. Fetch all files for these subjects
        const subjectIds = validSubjects.map(s => s._id);
        const allFilesForSubjects = await SMFiles.find({ sub: { $in: subjectIds } }).lean();

        // 4. Construct nested tree structure
        const uniMap = new Map();

        for (const subject of validSubjects) {
            const college = subject.college;
            const university = college.university;
            const course = subject.course;
            const sem = subject.sem;
            const batch = subject.batch;

            if (!uniMap.has(university._id.toString())) {
                uniMap.set(university._id.toString(), {
                    ...university,
                    collegesMap: new Map()
                });
            }
            const uniNode = uniMap.get(university._id.toString());

            if (!uniNode.collegesMap.has(college._id.toString())) {
                uniNode.collegesMap.set(college._id.toString(), {
                    ...college,
                    coursesMap: new Map()
                });
            }
            const collegeNode = uniNode.collegesMap.get(college._id.toString());

            if (!collegeNode.coursesMap.has(course._id.toString())) {
                collegeNode.coursesMap.set(course._id.toString(), {
                    ...course,
                    semestersMap: new Map()
                });
            }
            const courseNode = collegeNode.coursesMap.get(course._id.toString());

            if (!courseNode.semestersMap.has(sem._id.toString())) {
                courseNode.semestersMap.set(sem._id.toString(), {
                    ...sem,
                    batchesMap: new Map()
                });
            }
            const semNode = courseNode.semestersMap.get(sem._id.toString());

            if (!semNode.batchesMap.has(batch._id.toString())) {
                semNode.batchesMap.set(batch._id.toString(), {
                    ...batch,
                    subjectsMap: new Map()
                });
            }
            const batchNode = semNode.batchesMap.get(batch._id.toString());

            if (!batchNode.subjectsMap.has(subject._id.toString())) {
                const subjectFiles = allFilesForSubjects.filter(f => 
                    f.sub.toString() === subject._id.toString()
                );

                // Sort files ascending by decoded name
                subjectFiles.sort((a, b) => {
                    const nameA = (a.name || a.fileurl.split("/").pop().split("?")[0]).toLowerCase();
                    const nameB = (b.name || b.fileurl.split("/").pop().split("?")[0]).toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                batchNode.subjectsMap.set(subject._id.toString(), {
                    ...subject,
                    children: subjectFiles
                });
            }
        }

        // 5. Flatten the nested tree structure and sort ascending recursively
        const universitiesList = Array.from(uniMap.values()).map(uni => {
            const colleges = Array.from(uni.collegesMap.values()).map(coll => {
                const courses = Array.from(coll.coursesMap.values()).map(crs => {
                    const semesters = Array.from(crs.semestersMap.values()).map(sm => {
                        const batches = Array.from(sm.batchesMap.values()).map(bt => {
                            const subjects = Array.from(bt.subjectsMap.values());
                            subjects.sort((a, b) => a.name.localeCompare(b.name));
                            return {
                                ...bt,
                                children: subjects
                            };
                        });
                        batches.sort((a, b) => a.startyear - b.startyear);
                        return {
                            ...sm,
                            children: batches
                        };
                    });
                    semesters.sort((a, b) => a.sem - b.sem);
                    return {
                        ...crs,
                        children: semesters
                    };
                });
                courses.sort((a, b) => a.name.localeCompare(b.name));
                return {
                    ...coll,
                    children: courses
                };
            });
            colleges.sort((a, b) => a.name.localeCompare(b.name));
            return {
                ...uni,
                children: colleges
            };
        });

        universitiesList.sort((a, b) => a.name.localeCompare(b.name));

        // 6. Paginate top-level Universities
        const total = universitiesList.length;
        const paginatedUniversities = universitiesList.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: paginatedUniversities
        }, { status: 200 });

    } catch (error) {
        console.error("SM Search Tree Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
