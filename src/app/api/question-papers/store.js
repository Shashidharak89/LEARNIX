import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";
import QPSubjects from "@/models/QPSubjects";
import QPBatches from "@/models/QPBatches";
import QPExamType from "@/models/QPExamType";
import QPSemesters from "@/models/QPSemesters";
import QPCourse from "@/models/QPCourse";

function normalizeExamType(examKey = "") {
    return String(examKey).toUpperCase();
}

function sortPaperList(papers) {
    return [...papers].sort((a, b) => {
        const semDiff = (a.semester || 0) - (b.semester || 0);
        if (semDiff !== 0) return semDiff;

        const batchA = String(a.batch || "");
        const batchB = String(b.batch || "");
        const batchDiff = batchA.localeCompare(batchB, undefined, { numeric: true, sensitivity: "base" });
        if (batchDiff !== 0) return batchDiff;

        return String(a.examType || "").localeCompare(String(b.examType || ""));
    });
}

function normalizeKey(value = "") {
    return String(value).trim().toLowerCase();
}

function textIncludes(value, query) {
    return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
}

async function fetchAllPapers() {
    await connectDB();
    
    // Using lean() for faster read operations
    const qpImages = await QPImages.find()
        .populate({
            path: 'subject',
            populate: [
                { path: 'semester', model: 'QPSemesters' },
                { path: 'course', model: 'QPCourse' }
            ]
        })
        .populate('batch')
        .populate('examtype')
        .lean();

    const grouped = new Map();

    for (const img of qpImages) {
        if (!img.subject || !img.batch || !img.examtype || !img.subject.semester) continue;
        
        const semester = img.subject.semester.semesterNumber;
        const courseName = img.subject.course ? img.subject.course.name : '';
        const semesterLabel = courseName ? `${courseName} Semester ${semester}` : `Semester ${semester}`;
        const batch = `${img.batch.startYear}-${img.batch.endYear}`;
        const examType = normalizeExamType(img.examtype.name);
        
        // Use a composite key based on properties
        const paperId = `${semester}_${batch}_${examType}`.replace(/\s+/g, "_");
        
        if (!grouped.has(paperId)) {
            grouped.set(paperId, {
                id: paperId,
                paperId: paperId,
                semester,
                semesterLabel,
                batch,
                examType,
                subjectsMap: new Map(),
                visitlinks: []
            });
        }
        
        const group = grouped.get(paperId);
        
        if (img.visitLink) {
            group.visitlinks.push(img.visitLink);
        }
        
        const subjectName = img.subject.name;
        if (!group.subjectsMap.has(subjectName)) {
            group.subjectsMap.set(subjectName, []);
        }
        group.subjectsMap.get(subjectName).push(...(img.imageUrls || []));
    }

    const papers = [];
    for (const group of grouped.values()) {
        const subjects = Array.from(group.subjectsMap.entries()).map(([subject, images]) => ({
            subject,
            images: images.filter(Boolean)
        })).filter(item => item.images.length > 0);
        
        const allImages = subjects.flatMap(item => item.images);
        
        papers.push({
            id: group.id,
            paperId: group.paperId,
            semester: group.semester,
            semesterLabel: group.semesterLabel,
            batch: group.batch,
            examType: group.examType,
            subjects,
            totalSubjects: subjects.length,
            totalImages: allImages.length,
            previewImages: allImages.slice(0, 2),
            visitlinks: Array.from(new Set(group.visitlinks))
        });
    }

    return papers;
}

export async function buildQuestionPaperTree(filters = {}) {
    const list = await listQuestionPapers(filters);
    const grouped = new Map();

    for (const paper of list) {
        const semesterKey = paper.semesterLabel || `Semester ${paper.semester ?? ""}`;
        const batchKey = paper.batch;
        // examKey unused as grouping goes up to batch

        if (!grouped.has(semesterKey)) {
            grouped.set(semesterKey, new Map());
        }

        const semesterMap = grouped.get(semesterKey);
        if (!semesterMap.has(batchKey)) {
            semesterMap.set(batchKey, []);
        }

        semesterMap.get(batchKey).push(paper);
    }

    return Array.from(grouped.entries()).map(([semesterLabel, batchMap]) => {
        const batches = Array.from(batchMap.entries()).map(([batch, batchPapers]) => ({
            batch,
            exams: sortPaperList(batchPapers).map((paper) => ({
                id: paper.id,
                paperId: paper.paperId,
                examType: paper.examType,
                totalSubjects: paper.totalSubjects,
                totalImages: paper.totalImages,
                previewImages: paper.previewImages,
                source: "mongodb",
            })),
        }));

        // Simple extraction of semester number
        const match = String(semesterLabel).match(/\d+/);
        const semNumber = match ? Number(match[0]) : 0;

        return {
            semesterLabel,
            semester: semNumber,
            batches,
        };
    }).sort((a, b) => (a.semester || 0) - (b.semester || 0));
}

export async function getQuestionPaperByTreePath(semester, batch, examType) {
    const papers = await fetchAllPapers();
    const normalizedBatch = normalizeKey(batch);
    const normalizedExam = normalizeKey(examType);

    return papers.find((paper) => {
        return String(paper.semester) === String(semester) &&
            normalizeKey(paper.batch) === normalizedBatch &&
            normalizeKey(paper.examType) === normalizedExam;
    }) || null;
}

export async function listQuestionPapers(filters = {}) {
    const papers = await fetchAllPapers();
    const { batch, examType, semester, subject, q } = filters;

    return papers.filter((paper) => {
        if (batch && !textIncludes(paper.batch, batch)) return false;
        if (examType && !textIncludes(paper.examType, examType)) return false;
        if (semester && String(paper.semester) !== String(semester)) return false;
        if (subject) {
            const subjectMatch = paper.subjects.some((item) => textIncludes(item.subject, subject));
            if (!subjectMatch) return false;
        }
        if (q) {
            const matched =
                textIncludes(paper.batch, q) ||
                textIncludes(paper.examType, q) ||
                textIncludes(paper.semesterLabel, q) ||
                paper.subjects.some((item) => textIncludes(item.subject, q));
            if (!matched) return false;
        }

        return true;
    });
}

export async function getQuestionPaperById(id) {
    const papers = await fetchAllPapers();
    return papers.find((paper) => paper.id === id) || null;
}

export function getQuestionPaperSubjects(paper, subjectQuery) {
    if (!paper) return [];

    if (!subjectQuery) {
        return paper.subjects;
    }

    return paper.subjects.filter((item) => textIncludes(item.subject, subjectQuery));
}

export function buildQuestionPaperResponse(paper, subjectQuery = "") {
    if (!paper) return null;

    const subjects = getQuestionPaperSubjects(paper, subjectQuery);
    const images = subjects.flatMap((item) => item.images);

    return {
        id: paper.id,
        paperId: paper.paperId,
        semester: paper.semester,
        semesterLabel: paper.semesterLabel,
        batch: paper.batch,
        examType: paper.examType,
        totalSubjects: subjects.length,
        totalImages: images.length,
        previewImages: images.slice(0, 2),
        visitlinks: paper.visitlinks,
        subjects,
        images,
        source: "mongodb",
    };
}

export function buildQuestionPaperPdfImages(paper, subjectQuery = "") {
    if (!paper) return [];
    return getQuestionPaperSubjects(paper, subjectQuery).flatMap((item) => item.images);
}

function normalizeSubject(value = "") {
    return String(value).trim().toLowerCase();
}

export async function listAllSubjectNames() {
    const papers = await fetchAllPapers();
    const subjectMap = new Map();

    for (const paper of papers) {
        for (const item of paper.subjects || []) {
            const trimmed = String(item.subject || "").trim();
            if (!trimmed) continue;

            const key = normalizeSubject(trimmed);
            if (!subjectMap.has(key)) {
                subjectMap.set(key, trimmed);
            }
        }
    }

    return Array.from(subjectMap.values()).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
    );
}

export async function getSubjectAggregate(subjectName) {
    const papers = await fetchAllPapers();
    const target = normalizeSubject(subjectName);
    if (!target) return null;

    const occurrences = [];
    const images = [];

    for (const paper of papers) {
        const matched = (paper.subjects || []).find(
            (item) => normalizeSubject(item.subject) === target
        );

        if (!matched) continue;

        const matchedImages = Array.isArray(matched.images) ? matched.images.filter(Boolean) : [];
        images.push(...matchedImages);

        occurrences.push({
            paperId: paper.paperId,
            semester: paper.semester,
            semesterLabel: paper.semesterLabel,
            batch: paper.batch,
            examType: paper.examType,
            imageCount: matchedImages.length,
            images: matchedImages,
        });
    }

    if (occurrences.length === 0) {
        return null;
    }

    const uniqueImages = Array.from(new Set(images));
    const canonicalSubject = occurrences.length > 0
        ? (occurrences[0].images ? String(subjectName).trim() : String(subjectName).trim())
        : String(subjectName).trim();

    return {
        subject: canonicalSubject,
        totalPapers: occurrences.length,
        totalImages: uniqueImages.length,
        images: uniqueImages,
        occurrences,
        source: "mongodb",
    };
}

export async function buildSubjectPdfImages(subjectName) {
    const data = await getSubjectAggregate(subjectName);
    return data ? data.images : [];
}
