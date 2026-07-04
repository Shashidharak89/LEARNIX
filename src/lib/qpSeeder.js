import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPSemesters from "@/models/QPSemesters";
import QPExamType from "@/models/QPExamType";
import QPBatches from "@/models/QPBatches";
import QPSubjects from "@/models/QPSubjects";

export async function seedQPData() {
    try {
        await connectDB();

        // Read seed data from JSON file
        const seedDataPath = path.join(process.cwd(), "qp-seed-data.json");
        const seedDataRaw = fs.readFileSync(seedDataPath, "utf-8");
        const seedData = JSON.parse(seedDataRaw);

        console.log("Starting QP data seeding...");

        // 1. Seed Universities
        const universityCount = await QPUniversities.countDocuments();
        if (universityCount === 0) {
            console.log("Seeding universities...");
            const universities = await QPUniversities.insertMany(seedData.universities || []);
            console.log(`✓ Seeded ${universities.length} universities`);
        } else {
            console.log(`✓ Universities already exist (${universityCount})`);
        }

        // 2. Seed Colleges
        const collegeCount = await QPColleges.countDocuments();
        if (collegeCount === 0) {
            console.log("Seeding colleges...");
            const universityMap = {};
            const universities = await QPUniversities.find();
            universities.forEach((u) => {
                universityMap[u.code] = u._id;
            });

            const collegeData = (seedData.colleges || []).map((college) => ({
                ...college,
                university: universityMap[college.universityCode] || null
            }));

            const colleges = await QPColleges.insertMany(collegeData);
            console.log(`✓ Seeded ${colleges.length} colleges`);
        } else {
            console.log(`✓ Colleges already exist (${collegeCount})`);
        }

        // 3. Seed Semesters
        const semesterCount = await QPSemesters.countDocuments();
        if (semesterCount === 0) {
            console.log("Seeding semesters...");
            const semesters = await QPSemesters.insertMany(seedData.semesters || []);
            console.log(`✓ Seeded ${semesters.length} semesters`);
        } else {
            console.log(`✓ Semesters already exist (${semesterCount})`);
        }

        // 4. Seed Exam Types
        const examTypeCount = await QPExamType.countDocuments();
        if (examTypeCount === 0) {
            console.log("Seeding exam types...");
            const examTypes = await QPExamType.insertMany(seedData.examTypes || []);
            console.log(`✓ Seeded ${examTypes.length} exam types`);
        } else {
            console.log(`✓ Exam types already exist (${examTypeCount})`);
        }

        // 5. Seed Batches
        const batchCount = await QPBatches.countDocuments();
        if (batchCount === 0) {
            console.log("Seeding batches...");
            const batches = await QPBatches.insertMany(seedData.batches || []);
            console.log(`✓ Seeded ${batches.length} batches`);
        } else {
            console.log(`✓ Batches already exist (${batchCount})`);
        }

        // 6. Seed Subjects
        const subjectCount = await QPSubjects.countDocuments();
        if (subjectCount === 0) {
            console.log("Seeding subjects...");

            const semesterMap = {};
            const semesters = await QPSemesters.find();
            semesters.forEach((s) => {
                semesterMap[s.semesterNumber] = s._id;
            });

            const defaultCollege = await QPColleges.findOne().sort({ createdAt: 1 });

            const subjectData = (seedData.subjects || []).map((subject) => ({
                ...subject,
                semester: semesterMap[subject.semesterNumber] || null,
                college: defaultCollege?._id || null
            }));

            const subjects = await QPSubjects.insertMany(subjectData);
            console.log(`✓ Seeded ${subjects.length} subjects`);
        } else {
            console.log(`✓ Subjects already exist (${subjectCount})`);
        }

        console.log("✓ QP Data seeding completed successfully!");
        return {
            success: true,
            message: "QP data seeded successfully"
        };
    } catch (error) {
        console.error("Error seeding QP data:", error);
        throw error;
    }
}
