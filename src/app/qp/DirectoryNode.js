"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiChevronDown, FiFolder, FiFileText } from "react-icons/fi";

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
    
    // For Semester level, we group combinations of Batch+ExamType locally from the paginated groups endpoint
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
                    // For semesters, we receive grouped Batch+ExamType combinations.
                    // We need to group them by Batch to display Batch -> ExamType
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

    return (
        <div style={{ marginLeft: level > 0 ? "20px" : "0", marginTop: "8px" }}>
            <div 
                onClick={handleToggle}
                style={{ 
                    display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", 
                    padding: "8px 12px", background: expanded ? "#f0f7ff" : "#fff", 
                    border: "1px solid #eaeaea", borderRadius: "8px", transition: "0.2s",
                    fontWeight: expanded ? "600" : "500", color: "#333",
                    boxShadow: expanded ? "0 2px 8px rgba(11, 116, 255, 0.1)" : "none"
                }}
            >
                {expanded ? <FiChevronDown color="#0b74ff" /> : <FiChevronRight color="#888" />}
                <FiFolder color={expanded ? "#0b74ff" : "#f2c200"} />
                <span>{displayName}</span>
            </div>

            {expanded && (
                <div style={{ borderLeft: "2px solid #eaeaea", marginLeft: "14px", paddingLeft: "10px", marginTop: "5px" }}>
                    {loading && page === 1 && (
                        <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>Loading...</div>
                    )}
                    
                    {!loading && type !== "semester" && children.length === 0 && (
                        <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>No items found.</div>
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
                        <div key={batchId} style={{ marginLeft: "20px", marginTop: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", fontWeight: "600", color: "#444" }}>
                                <FiFolder color="#ff6b00" />
                                <span>Batch {groupedBatches[batchId].name}</span>
                            </div>
                            <div style={{ borderLeft: "2px solid #eaeaea", marginLeft: "6px", paddingLeft: "14px", marginTop: "4px" }}>
                                {groupedBatches[batchId].exams.map((exam, idx) => {
                                    const url = `/qp/compiled?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${data._id}&batchId=${exam.batchId || ''}&examTypeId=${exam.examTypeId}`;
                                    return (
                                        <div key={idx} style={{ marginTop: "6px", marginBottom: "6px" }}>
                                            <a 
                                                href={url} target="_blank" rel="noopener noreferrer" 
                                                style={{ 
                                                    display: "inline-flex", alignItems: "center", gap: "8px", 
                                                    textDecoration: "none", color: "#0b74ff", fontWeight: "600", 
                                                    padding: "6px 12px", background: "#f8faff", borderRadius: "6px", 
                                                    border: "1px solid #0b74ff", fontSize: "14px", transition: "0.2s" 
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = "#0b74ff"; e.currentTarget.style.color = "#fff"; }} 
                                                onMouseOut={(e) => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.color = "#0b74ff"; }}
                                            >
                                                <FiFileText /> View {exam.name}
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {page < totalPages && (
                        <button 
                            onClick={handleLoadMore}
                            disabled={loading}
                            style={{
                                marginTop: "10px", marginLeft: "20px", background: "none", border: "none",
                                color: "#0b74ff", fontWeight: "600", cursor: "pointer", fontSize: "14px",
                                textDecoration: "underline"
                            }}
                        >
                            {loading ? "Loading..." : "Load More"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
