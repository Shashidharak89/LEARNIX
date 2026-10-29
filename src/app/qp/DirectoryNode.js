"use client";

import React, { useState } from "react";
import { FiChevronRight, FiChevronDown, FiFolder, FiFileText, FiBookmark } from "react-icons/fi";
import { toggleLearnLaterClient } from "@/lib/clientLearnLater";

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
            if (type === "semester") endpoint = `/api/qp/v1/compiled/groups?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${data._id}&page=${pageNum}&limit=20`;
            
            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (json.success) {
                if (type === "semester") {
                    const newGroups = append ? { ...groupedBatches } : {};
                    json.data.forEach(item => {
                        if (item.type === "group") {
                            const batchId = item.batch ? item.batch._id : "unknown";
                            const batchName = item.batch ? `${item.batch.startYear}-${item.batch.endYear}` : "Unknown Batch";
                            if (!newGroups[batchId]) newGroups[batchId] = { name: batchName, exams: [] };
                            
                            newGroups[batchId].exams.push({
                                examTypeId: item.examtype ? item.examtype._id : "unknown",
                                name: item.examtype ? item.examtype.name : "Unknown Exam",
                                batchId: item.batch ? item.batch._id : null
                            });
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
                            <span>Loading items...</span>
                        </div>
                    )}
                    
                    {!loading && type !== "semester" && children.length === 0 && (
                        <div className="qp-dir-empty">No items found.</div>
                    )}

                    {type !== "semester" && children.map(child => (
                        <DirectoryNode 
                            key={child._id} 
                            level={level + 1} 
                            type={nextType} 
                            data={child} 
                            parentParams={nextParams}
                        />
                    ))}

                    {type === "semester" && Object.keys(groupedBatches).map(batchId => (
                        <div key={batchId} className="qp-dir-batch-group">
                            <div className="qp-dir-batch-header">
                                <span className="qp-dir-batch-badge">
                                    Batch {groupedBatches[batchId].name}
                                </span>
                            </div>
                            <div className="qp-dir-exams-list">
                                {groupedBatches[batchId].exams.map((exam, idx) => {
                                    const url = `/qp/compiled?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${data._id}&batchId=${exam.batchId || ''}&examTypeId=${exam.examTypeId}`;
                                    return (
                                        <div key={idx} className="qp-dir-exam-item">
                                            <a 
                                                href={url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="qp-dir-exam-link"
                                            >
                                                <FiFileText size={15} />
                                                <span>View {exam.name}</span>
                                            </a>
                                            <button
                                                type="button"
                                                title="Add to Learn Later"
                                                aria-label={`Save ${exam.name} to Learn Later`}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await toggleLearnLaterClient({
                                                        type: "question-paper",
                                                        targetId: `${exam.batchId || 'batch'}-${exam.examTypeId}`,
                                                        title: `${exam.name} - Batch ${groupedBatches[batchId]?.name || ''}`,
                                                        subtitle: `Semester ${data.semesterNumber || ''}`,
                                                        description: `Compiled Question Papers for ${exam.name}`,
                                                        url,
                                                        metadata: {
                                                            batchId: exam.batchId,
                                                            examTypeId: exam.examTypeId,
                                                        }
                                                    });
                                                }}
                                                className="qp-dir-bookmark-btn"
                                            >
                                                <FiBookmark size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

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
