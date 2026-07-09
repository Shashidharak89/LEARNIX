"use client";

import React, { useState } from "react";
import { FiChevronRight, FiChevronDown, FiFolder, FiFileText } from "react-icons/fi";

export default function SMDirectoryNode({ 
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

    const fetchChildren = async (pageNum, append = false) => {
        setLoading(true);
        try {
            let endpoint = "";
            if (type === "university") {
                endpoint = `/api/sm/v1/colleges/by-university?universityId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "college") {
                endpoint = `/api/sm/v1/courses/by-college?collegeId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "course") {
                endpoint = `/api/sm/v1/semesters/by-course?collegeId=${parentParams.collegeId}&courseId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "semester") {
                endpoint = `/api/sm/v1/batches/by-semester?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "batch") {
                endpoint = `/api/sm/v1/subjects/by-batch?collegeId=${parentParams.collegeId}&courseId=${parentParams.courseId}&semesterId=${parentParams.semesterId}&batchId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "subject") {
                endpoint = `/api/sm/v1/files/by-subject?subjectId=${data._id}&page=${pageNum}&limit=20`;
            }

            const res = await fetch(endpoint, { cache: "no-store" });
            const json = await res.json();
            
            if (json.success) {
                if (append) {
                    setChildren(prev => [...prev, ...json.data]);
                } else {
                    setChildren(json.data);
                }
                setTotalPages(json.pagination.totalPages);
            }
        } catch (err) {
            console.error("Error fetching node children", err);
        }
        setLoading(false);
    };

    const handleToggle = () => {
        if (!expanded && children.length === 0) {
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
    if (type === "semester") nextType = "batch";
    if (type === "batch") nextType = "subject";

    const nextParams = { ...parentParams };
    if (type === "university") nextParams.universityId = data._id;
    if (type === "college") nextParams.collegeId = data._id;
    if (type === "course") nextParams.courseId = data._id;
    if (type === "semester") nextParams.semesterId = data._id;
    if (type === "batch") nextParams.batchId = data._id;

    // Display names
    let displayName = data.name;
    if (type === "semester") displayName = `Semester ${data.sem}`;
    if (type === "batch") displayName = `Batch ${data.startyear}-${data.endyear}`;
    if (type === "file") displayName = data.name || "View Study File Resource";

    return (
        <div style={{ marginLeft: level > 0 ? "20px" : "0", marginTop: "8px" }}>
            {type !== "file" ? (
                <>
                    <div 
                        onClick={handleToggle}
                        style={{ 
                            display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", 
                            padding: "8px 12px", background: expanded ? "#f5f3ff" : "#fff", 
                            border: "1px solid #eaeaea", borderRadius: "8px", transition: "0.2s",
                            fontWeight: expanded ? "600" : "500", color: "#333",
                            boxShadow: expanded ? "0 2px 8px rgba(124, 58, 237, 0.1)" : "none"
                        }}
                    >
                        {expanded ? <FiChevronDown color="#7c3aed" /> : <FiChevronRight color="#888" />}
                        <FiFolder color={expanded ? "#7c3aed" : "#a78bfa"} />
                        <span>{displayName}</span>
                    </div>

                    {expanded && (
                        <div style={{ borderLeft: "2px solid #eaeaea", marginLeft: "14px", paddingLeft: "10px", marginTop: "5px" }}>
                            {loading && page === 1 && (
                                <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>Loading...</div>
                            )}
                            
                            {!loading && children.length === 0 && (
                                <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>No items found.</div>
                            )}

                            {children.map(child => (
                                <SMDirectoryNode 
                                    key={child._id} 
                                    level={level + 1} 
                                    type={nextType || "file"} 
                                    data={child} 
                                    parentParams={nextParams}
                                />
                            ))}

                            {page < totalPages && (
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    style={{
                                        marginTop: "10px", marginLeft: "20px", background: "none", border: "none",
                                        color: "#7c3aed", fontWeight: "600", cursor: "pointer", fontSize: "14px",
                                        textDecoration: "underline"
                                    }}
                                >
                                    {loading ? "Loading..." : "Load More"}
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div style={{ marginTop: "6px", marginBottom: "6px", marginLeft: "20px" }}>
                    <a 
                        href={data.fileurl} target="_blank" rel="noopener noreferrer" 
                        style={{ 
                            display: "inline-flex", alignItems: "center", gap: "8px", 
                            textDecoration: "none", color: "#7c3aed", fontWeight: "600", 
                            padding: "6px 12px", background: "#fdfbff", borderRadius: "6px", 
                            border: "1px solid #7c3aed", fontSize: "14px", transition: "0.2s" 
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }} 
                        onMouseOut={(e) => { e.currentTarget.style.background = "#fdfbff"; e.currentTarget.style.color = "#7c3aed"; }}
                    >
                        <FiFileText /> {displayName}
                    </a>
                </div>
            )}
        </div>
    );
}
