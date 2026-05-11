import questionPapersData from "@/app/qp/questionPapersData";

function getSemesterNumber(label = "") {
    const match = String(label).match(/\d+/);
    return match ? Number(match[0]) : null;
}

function normalizeExamType(examKey = "") {
    return String(examKey).toUpperCase();
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenQuestionPaperData() {
    const papers = [];

    for (const semesterEntry of questionPapersData) {
        const semesterLabel = semesterEntry.semister || semesterEntry.semester || "";
        const semester = getSemesterNumber(semesterLabel);

        for (const batchEntry of semesterEntry.batches || []) {
            const batch = batchEntry.batchname || batchEntry.batch || "";

            for (const [examKey, examData] of Object.entries(batchEntry)) {
                if (examKey === "batchname" || !isPlainObject(examData)) continue;

                const subjects = Object.entries(examData.imageurls || {})
                    .map(([subject, images]) => ({
                        subject,
                        images: Array.isArray(images) ? images.filter(Boolean) : [],
                    }))
                    .filter((item) => item.images.length > 0);

                const allImages = subjects.flatMap((item) => item.images);

                papers.push({
                    id: examData.id,
                    paperId: examData.id,
                    semester,
                    semesterLabel,
                    batch,
                    examType: normalizeExamType(examKey),
                    subjects,
                    totalSubjects: subjects.length,
                    totalImages: allImages.length,
                    previewImages: allImages.slice(0, 2),
                    visitlinks: Array.isArray(examData.visitlink) ? examData.visitlink : [],
                });
            }
        }
    }

    return papers.filter((paper) => Boolean(paper.id));
}

const QUESTION_PAPERS = flattenQuestionPaperData();

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

export function buildQuestionPaperTree(filters = {}) {
    const list = listQuestionPapers(filters);
    const grouped = new Map();

    for (const paper of list) {
        const semesterKey = paper.semesterLabel || `Semester ${paper.semester ?? ""}`;
        const batchKey = paper.batch;
        const examKey = paper.examType;

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
                source: "static-json",
            })),
        }));

        return {
            semesterLabel,
            semester: getSemesterNumber(semesterLabel),
            batches,
        };
    }).sort((a, b) => (a.semester || 0) - (b.semester || 0));
}

export function getQuestionPaperByTreePath(semester, batch, examType) {
    const semesterLabel = `MCA Semester ${semester}`;
    const normalizedBatch = normalizeKey(batch);
    const normalizedExam = normalizeKey(examType);

    return QUESTION_PAPERS.find((paper) => {
        return String(paper.semester) === String(semester) &&
            normalizeKey(paper.batch) === normalizedBatch &&
            normalizeKey(paper.examType) === normalizedExam;
    }) || null;
}

function textIncludes(value, query) {
    return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
}

export function listQuestionPapers(filters = {}) {
    const { batch, examType, semester, subject, q } = filters;

    return QUESTION_PAPERS.filter((paper) => {
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

export function getQuestionPaperById(id) {
    return QUESTION_PAPERS.find((paper) => paper.id === id) || null;
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
        source: "static-json",
    };
}

export function buildQuestionPaperPdfImages(paper, subjectQuery = "") {
    if (!paper) return [];
    return getQuestionPaperSubjects(paper, subjectQuery).flatMap((item) => item.images);
}
