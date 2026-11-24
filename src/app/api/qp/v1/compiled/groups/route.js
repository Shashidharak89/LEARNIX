import { stripKeywords } from "@/lib/sanitizeKeywords";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";
import QPSubjects from "@/models/QPSubjects";
import QPBatches from "@/models/QPBatches";
import QPExamType from "@/models/QPExamType";
import mongoose from "mongoose";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const subjectId = url.searchParams.get("subjectId");
        const collegeId = url.searchParams.get("collegeId");
        const batchId = url.searchParams.get("batchId");
        const examTypeId = url.searchParams.get("examTypeId");
        const courseId = url.searchParams.get("courseId");
        const semesterId = url.searchParams.get("semesterId");
        const universityId = url.searchParams.get("universityId");
        
        const matchStage = {};
        
        if (subjectId) matchStage.subject = new mongoose.Types.ObjectId(subjectId);
        if (collegeId) {
            matchStage.college = new mongoose.Types.ObjectId(collegeId);
        } else if (universityId) {
            const collegesUnderUni = await QPColleges.find({ university: universityId }).select("_id").lean();
            const collegeIds = collegesUnderUni.map(c => new mongoose.Types.ObjectId(c._id));
            if (collegeIds.length > 0) {
                matchStage.college = { $in: collegeIds };
            }
        }
        if (batchId) matchStage.batch = new mongoose.Types.ObjectId(batchId);
        if (examTypeId) matchStage.examtype = new mongoose.Types.ObjectId(examTypeId);

        if (courseId || semesterId) {
            const subjectQuery = {};
            if (subjectId) subjectQuery._id = subjectId;
            if (collegeId) subjectQuery.college = collegeId;
            else if (universityId) {
                const collegesUnderUni = await QPColleges.find({ university: universityId }).select("_id").lean();
                const collegeIds = collegesUnderUni.map(c => c._id);
                if (collegeIds.length > 0) subjectQuery.college = { $in: collegeIds };
            }
            if (courseId) subjectQuery.course = courseId;
            if (semesterId) subjectQuery.semester = semesterId;
            
            const validSubjects = await QPSubjects.find(subjectQuery).select('_id').lean();
            const validSubjectIds = validSubjects.map(s => new mongoose.Types.ObjectId(s._id));
            matchStage.subject = { $in: validSubjectIds };
        }

        let pipeline = [{ $match: matchStage }];
        let countPipeline = [{ $match: matchStage }];

        if (subjectId) {
            // Group by Subject
            const groupStage = {
                $group: {
                    _id: "$subject",
                    recordCount: { $sum: 1 }
                }
            };
            pipeline.push(groupStage);
            countPipeline.push(groupStage);
        } else {
            // Group by Batch and ExamType
            const groupStage = {
                $group: {
                    _id: { batch: "$batch", examtype: "$examtype" },
                    recordCount: { $sum: 1 },
                    firstSubject: { $first: "$subject" }
                }
            };
            pipeline.push(groupStage);
            countPipeline.push(groupStage);
        }

        // Add count logic
        countPipeline.push({ $count: "total" });
        const countResult = await QPImages.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination and population to main pipeline
        pipeline.push({ $sort: { _id: 1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        let results = await QPImages.aggregate(pipeline);

        // Populate references
        if (subjectId) {
            results = await QPImages.populate(results, { path: "_id", model: "QPSubjects" });
            results = results.map(r => ({ type: "subject", subject: r._id, recordCount: r.recordCount }));
        } else {
            results = await QPImages.populate(results, [
                { path: "_id.batch", model: "QPBatches" },
                { path: "_id.examtype", model: "QPExamType" }
            ]);
            results = results.map(r => ({
                type: "group",
                batch: r._id.batch,
                examtype: r._id.examtype,
                recordCount: r.recordCount
            }));
        }

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: stripKeywords(results)
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
