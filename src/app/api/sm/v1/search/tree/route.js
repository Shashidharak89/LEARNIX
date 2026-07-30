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

        const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            return NextResponse.json({
                success: true,
                pagination: { total: 0, page, limit, totalPages: 0 },
                data: []
            }, { status: 200 });
        }

        const uniOrConditions = words.map(w => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
        const collegeOrConditions = words.map(w => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
        const courseOrConditions = words.map(w => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
        const fileOrConditions = [];
        words.forEach(w => {
            const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            fileOrConditions.push({ name: { $regex: esc, $options: "i" } }, { fileurl: { $regex: esc, $options: "i" } });
        });

        // 1. Resolve matching IDs from all levels
        const [uniMatches, collegeMatches, courseMatches, semesters, batches, fileMatches] = await Promise.all([
            SMUniversity.find({ $or: uniOrConditions }).select("_id").lean(),
            SMCollege.find({ $or: collegeOrConditions }).select("_id").lean(),
            SMCourse.find({ $or: courseOrConditions }).select("_id").lean(),
            SMSemester.find({}).lean(),
            SMBatch.find({}).lean(),
            SMFiles.find({ $or: fileOrConditions }).select("_id sub").lean()
        ]);

        const uniIds = uniMatches.map(u => u._id);
        const collegeIds = collegeMatches.map(c => c._id);
        const courseIds = courseMatches.map(c => c._id);
        const fileIds = fileMatches.map(f => f._id);
        const fileParentSubjectIds = fileMatches.map(f => f.sub);

        // Resolve semester IDs matching keyword
        const semIds = semesters.filter(s => {
            const text = `Semester ${s.sem} ${s.sem} sem ${s.sem}`.toLowerCase();
            return words.some(w => text.includes(w));
        }).map(s => s._id);

        // Resolve batch IDs matching keyword
        const batchIds = batches.filter(b => {
            const text = `Batch ${b.startyear}-${b.endyear} ${b.startyear} ${b.endyear}`.toLowerCase();
            return words.some(w => text.includes(w));
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
        const subjectOrConditions = words.map(w => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
        if (collegeIdsResolved.length > 0) subjectOrConditions.push({ college: { $in: collegeIdsResolved } });
        if (courseIds.length > 0) subjectOrConditions.push({ course: { $in: courseIds } });
        if (semIds.length > 0) subjectOrConditions.push({ sem: { $in: semIds } });
        if (batchIds.length > 0) subjectOrConditions.push({ batch: { $in: batchIds } });
        if (fileParentSubjectIds.length > 0) subjectOrConditions.push({ _id: { $in: fileParentSubjectIds } });

        const matchingSubjects = await SMSubject.find({ $or: subjectOrConditions })
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
                            subjects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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

        universitiesList.forEach(uni => {
            let score = 0;
            const treeText = JSON.stringify(uni).toLowerCase();
            for (const word of words) {
                if (treeText.includes(word)) {
                    score += 1;
                }
            }
            uni.__score = score;
        });

        universitiesList.sort((a, b) => (b.__score - a.__score) || a.name.localeCompare(b.name));

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
