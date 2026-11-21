"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiChevronDown, FiFolder, FiFileText, FiBookmark, FiArrowUpRight } from "react-icons/fi";
import {
    toggleLearnLaterClient,
    checkLearnLaterStatusClient,
    isItemInLearnLaterStorage,
} from "@/lib/clientLearnLater";

function ExamPaperItem({ exam, batch, semesterData, parentParams, level = 0 }) {
    const targetId = `${exam.batchId || 'batch'}-${exam.examTypeId}`;
    const [isBookmarked, setIsBookmarked] = useState(() => isItemInLearnLaterStorage("question-paper", targetId));
    const [bookmarking, setBookmarking] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (targetId) {
            if (isItemInLearnLaterStorage("question-paper", targetId)) {
                setIsBookmarked(true);
            }
            checkLearnLaterStatusClient([{ type: "question-paper", targetId }])
                .then((res) => {
                    if (mounted && res) {
                        if (res[`question-paper#${targetId}`] || res[`question-paper:${targetId}`] || res[targetId]) {
                            setIsBookmarked(true);
                        } else if (res[`question-paper#${targetId}`] === false || res[`question-paper:${targetId}`] === false) {
                            setIsBookmarked(false);
                        }
                    }
                })
                .catch(() => {});
        }
        return () => {
            mounted = false;
        };
    }, [targetId]);

    useEffect(() => {
        const handleUpdate = (e) => {
            const eTargetId = e.detail?.item?.targetId || e.detail?.targetId;
            const eItemId = e.detail?.itemId;
            if (
                eTargetId === targetId ||
                eItemId === `question-paper#${targetId}` ||
                eItemId === `question-paper:${targetId}`
            ) {
                if (e.detail?.isSaved !== undefined) {
                    setIsBookmarked(e.detail.isSaved);
                }
            }
        };
        window.addEventListener("learnix:learn-later-updated", handleUpdate);
        return () => window.removeEventListener("learnix:learn-later-updated", handleUpdate);
    }, [targetId]);

    const url = `/qp/compiled?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${semesterData._id}&batchId=${exam.batchId || ''}&examTypeId=${exam.examTypeId}`;

    const handleBookmark = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (bookmarking) return;
        setBookmarking(true);
        try {
            const res = await toggleLearnLaterClient({
                type: "question-paper",
                targetId,
                title: `${exam.name} - Batch ${batch.name}`,
                subtitle: `Semester ${semesterData.semesterNumber || ''}`,
                description: `Compiled Question Papers for ${exam.name}`,
                url,
                metadata: {
                    batchId: exam.batchId,
                    examTypeId: exam.examTypeId,
                    recordCount: exam.recordCount,
                }
            });
            if (res && res.success) {
                setIsBookmarked(res.isSaved);
            }
        } catch (err) {
            console.error("Failed to toggle Learn Later", err);
        } finally {
            setBookmarking(false);
        }
    };

    return (
        <div 
            className="qp-dir-exam-row" 
            style={{ marginLeft: level > 0 ? "8px" : "0" }}
        >
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="qp-dir-exam-link"
                title={`Open compiled papers for ${exam.name}`}
            >
                <div className="qp-dir-exam-icon" aria-hidden="true">
                    <FiFileText size={17} />
                </div>
                <div className="qp-dir-exam-info">
                    <span className="qp-dir-exam-title">View {exam.name}</span>
                    <span className="qp-dir-exam-tag">Compiled Question Papers</span>
                </div>
                <div className="qp-dir-exam-action-icon" aria-hidden="true">
                    <FiArrowUpRight size={17} />
                </div>
            </a>
            <div className="qp-dir-exam-actions">
                <button
                    type="button"
                    title={isBookmarked ? "Saved in Learn Later" : "Save to Learn Later"}
                    aria-label={`Save ${exam.name} to Learn Later`}
                    onClick={handleBookmark}
                    className={`qp-dir-bookmark-btn ${isBookmarked ? "is-bookmarked" : ""}`}
                    disabled={bookmarking}
                >
                    <FiBookmark size={15} style={isBookmarked ? { fill: "currentColor" } : {}} />
                </button>
            </div>
        </div>
    );
}

function BatchDirectoryNode({ batch, semesterData, parentParams, level = 0 }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div 
            className="qp-dir-node qp-dir-node--nested" 
            style={{ marginLeft: level > 0 ? "8px" : "0" }}
        >
            <button 
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={`qp-dir-node-btn qp-dir-node-btn--nested ${expanded ? "is-expanded" : ""}`}
                aria-expanded={expanded}
            >
                <div className={`qp-dir-icon-badge ${expanded ? "is-expanded" : ""}`} aria-hidden="true">
                    <FiFolder />
                </div>
                <span className="qp-dir-node-name">Batch {batch.name}</span>
                {batch.exams?.length > 0 && (
                    <span className="qp-dir-count-badge">
                        {batch.exams.length} {batch.exams.length === 1 ? "exam" : "exams"}
                    </span>
                )}
                <span className={`qp-dir-chevron ${expanded ? "is-expanded" : ""}`} aria-hidden="true">
                    {expanded ? <FiChevronDown /> : <FiChevronRight />}
                </span>
            </button>

            {expanded && (
                <div className="qp-dir-children">
                    {batch.exams.length === 0 ? (
                        <div className="qp-dir-empty">No question papers found for this batch.</div>
                    ) : (
                        <div className="qp-dir-exams-list">
                            {batch.exams.map((exam, idx) => (
                                <ExamPaperItem
                                    key={exam.examTypeId || idx}
                                    exam={exam}
                                    batch={batch}
                                    semesterData={semesterData}
                                    parentParams={parentParams}
                                    level={level + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DirectoryNode({ 
    level = 0, 
    type = "university", 
    data, 
    parentParams = {},
}) {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // For Semester level, group combinations of Batch+ExamType
    const [groupedBatches, setGroupedBatches] = useState({});

    const fetchChildren = async (pageNum, append = false) => {
        setLoading(true);
        try {
            let endpoint = "";
            if (type === "university") endpoint = `/api/qp/v1/colleges/by-university?universityId=${data._id}&page=${pageNum}&limit=20`;
            if (type === "college") endpoint = `/api/qp/v1/courses/by-college?collegeId=${data._id}&page=${pageNum}&limit=20`;
            if (type === "course") endpoint = `/api/qp/v1/semesters/by-course?collegeId=${parentParams.collegeId}&courseId=${data._id}&page=${pageNum}&limit=20`;
            if (type === "semester") endpoint = `/api/qp/v1/compiled/groups?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${data._id}&page=${pageNum}&limit=50`;
            
            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (json.success) {
                if (type === "semester") {
                    const newGroups = append ? { ...groupedBatches } : {};
                    json.data.forEach(item => {
                        if (item.type === "group") {
                            const batchId = item.batch ? item.batch._id : "unknown";
                            const batchName = item.batch ? `${item.batch.startYear}-${item.batch.endYear}` : "General";
                            if (!newGroups[batchId]) newGroups[batchId] = { name: batchName, exams: [] };
                            
                            const examTypeId = item.examtype ? item.examtype._id : "unknown";
                            const exists = newGroups[batchId].exams.some(e => e.examTypeId === examTypeId);
                            if (!exists) {
                                newGroups[batchId].exams.push({
                                    examTypeId,
                                    name: item.examtype ? item.examtype.name : "Exam Papers",
                                    batchId: item.batch ? item.batch._id : null,
                                    recordCount: item.recordCount || 0
                                });
                            }
                        }
                    });
                    setGroupedBatches(newGroups);
                } else {
                    if (append) {
                        setChildren(prev => [...prev, ...json.data]);
                    } else {
                        setChildren(json.data);
                    }
                }
                setTotalPages(json.pagination.totalPages);
            }
        } catch (err) {
            console.error("Error fetching node children", err);
        }
        setLoading(false);
    };

    const handleToggle = () => {
        if (!expanded && children.length === 0 && Object.keys(groupedBatches).length === 0) {
            fetchChildren(1);
        }
        setExpanded(!expanded);
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchChildren(nextPage, true);
        }
    };

    let nextType = "";
    if (type === "university") nextType = "college";
    if (type === "college") nextType = "course";
    if (type === "course") nextType = "semester";

    const nextParams = { ...parentParams };
    if (type === "university") nextParams.universityId = data._id;
    if (type === "college") nextParams.collegeId = data._id;
    if (type === "course") nextParams.courseId = data._id;
    if (type === "semester") nextParams.semesterId = data._id;

    // Display names
    let displayName = data.name;
    if (type === "semester") displayName = `Semester ${data.semesterNumber}`;

    const isTopLevel = level === 0;

    const batchList = Object.keys(groupedBatches).map(batchId => ({
        id: batchId,
        ...groupedBatches[batchId]
    })).sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));

    return (
        <div 
            className={`qp-dir-node ${isTopLevel ? "qp-dir-node--toplevel" : "qp-dir-node--nested"}`} 
            style={{ marginLeft: level > 0 ? "8px" : "0" }}
        >
            <button 
                type="button"
                onClick={handleToggle}
                className={`qp-dir-node-btn ${isTopLevel ? "qp-dir-node-btn--toplevel" : "qp-dir-node-btn--nested"} ${expanded ? "is-expanded" : ""}`}
                aria-expanded={expanded}
            >
                <div className={`qp-dir-icon-badge ${isTopLevel ? "is-toplevel" : ""} ${expanded ? "is-expanded" : ""}`} aria-hidden="true">
                    <FiFolder />
                </div>
                <span className="qp-dir-node-name">{displayName}</span>
                <span className={`qp-dir-chevron ${expanded ? "is-expanded" : ""}`} aria-hidden="true">
                    {expanded ? <FiChevronDown /> : <FiChevronRight />}
                </span>
            </button>

            {expanded && (
                <div className="qp-dir-children">
                    {loading && page === 1 && (
                        <div className="qp-dir-loading">
                            <span className="qp-spinner-sm" aria-hidden="true" />
                            <span>{type === "semester" ? "Loading batches..." : "Loading items..."}</span>
                        </div>
                    )}
                    
                    {type === "semester" ? (
                        <div className="qp-dir-batches-list">
                            {!loading && batchList.length === 0 && (
                                <div className="qp-dir-empty">No batches found for this semester.</div>
                            )}

                            {batchList.map(batch => (
                                <BatchDirectoryNode
                                    key={batch.id}
                                    batch={batch}
                                    semesterData={data}
                                    parentParams={nextParams}
                                    level={level + 1}
                                />
                            ))}
                        </div>
                    ) : (
                        <>
                            {!loading && children.length === 0 && (
                                <div className="qp-dir-empty">No items found.</div>
                            )}

                            {children.map(child => (
                                <DirectoryNode 
                                    key={child._id} 
                                    level={level + 1} 
                                    type={nextType} 
                                    data={child} 
                                    parentParams={nextParams}
                                />
                            ))}
                        </>
                    )}

                    {page < totalPages && (
                        <button 
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="qp-dir-sub-loadmore"
                        >
                            {loading ? "Loading..." : "Load More"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
