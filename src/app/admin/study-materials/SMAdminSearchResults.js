"use client";

import React, { useState, useEffect } from "react";
import { 
    FiChevronRight, 
    FiChevronDown, 
    FiFolder, 
    FiFileText, 
    FiDownload, 
    FiCalendar, 
    FiUsers, 
    FiBookOpen, 
    FiAward 
} from "react-icons/fi";

const highlightText = (text, keyword) => {
    if (!keyword || !text) return <span>{text}</span>;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <mark key={i} style={{ background: "#fef08a", color: "#854d0e", padding: "0 2px", borderRadius: "2px", fontWeight: "bold" }}>
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

function SMAdminSearchDirectoryNode({
    level = 0,
    type = "university",
    data,
    parentParams = {},
    highlightKeyword = ""
}) {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [externalExpanded, setExternalExpanded] = useState(false);

    const fetchChildren = async (pageNum, append = false) => {
        setLoading(true);
        try {
            let endpoint = "";
            if (type === "university") {
                endpoint = `/api/sm/v1/colleges/by-university?universityId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "college") {
                endpoint = `/api/sm/v1/courses/by-college?collegeId=${data._id}&page=${pageNum}&limit=20`;
            } else if (type === "course") {
                endpoint = `/api/sm/v1/semesters/by-course?courseId=${data._id}&page=${pageNum}&limit=20`;
                if (parentParams.collegeId) {
                    endpoint += `&collegeId=${parentParams.collegeId}`;
                }
            } else if (type === "semester") {
                endpoint = `/api/sm/v1/batches/by-semester?semesterId=${data._id}&page=${pageNum}&limit=20`;
                if (parentParams.collegeId) endpoint += `&collegeId=${parentParams.collegeId}`;
                if (parentParams.courseId) endpoint += `&courseId=${parentParams.courseId}`;
            } else if (type === "batch") {
                endpoint = `/api/sm/v1/subjects/by-batch?batchId=${data._id}&page=${pageNum}&limit=20`;
                if (parentParams.collegeId) endpoint += `&collegeId=${parentParams.collegeId}`;
                if (parentParams.courseId) endpoint += `&courseId=${parentParams.courseId}`;
                if (parentParams.semesterId) endpoint += `&semesterId=${parentParams.semesterId}`;
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
                setTotalPages(json.pagination?.totalPages || 1);
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

    // Display names and icons
    let displayName = data.name;
    let IconComponent = FiFolder;
    let iconColor = "#3b82f6"; // blue

    if (type === "university") {
        IconComponent = FiAward;
        iconColor = "#2563eb";
    } else if (type === "college") {
        IconComponent = FiAward;
        iconColor = "#7c3aed";
    } else if (type === "course") {
        IconComponent = FiBookOpen;
        iconColor = "#059669";
    } else if (type === "semester") {
        displayName = `Semester ${data.sem}`;
        IconComponent = FiCalendar;
        iconColor = "#d97706";
    } else if (type === "batch") {
        displayName = `Batch ${data.startyear}-${data.endyear}`;
        IconComponent = FiUsers;
        iconColor = "#0891b2";
    } else if (type === "subject") {
        IconComponent = FiFolder;
        iconColor = "#4f46e5";
    }

    if (type === "file") {
        const rawFileName = data.name || data.fileurl.split("/").pop().split("?")[0];
        const fileName = decodeURIComponent(rawFileName);
        const encodedUrl = encodeURIComponent(data.fileurl);
        const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;

        return (
            <div style={{ marginTop: "4px", marginBottom: "4px", marginLeft: "20px" }}>
                <div 
                    onClick={() => window.open(viewUrl, "_blank", "noopener,noreferrer")}
                    style={{ 
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", 
                        textDecoration: "none", color: "#374151", fontWeight: "500", 
                        padding: "8px 16px", background: "#fdfbff", borderRadius: "8px", 
                        border: "1px solid #e5e7eb", fontSize: "14px", transition: "0.2s",
                        cursor: "pointer", width: "100%", boxSizing: "border-box"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(124, 58, 237, 0.05)"; }} 
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        <FiFileText style={{ flexShrink: 0, color: "#7c3aed" }} /> 
                        <span style={{ 
                            textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                            color: "#4b5563"
                        }}>
                            {highlightText(fileName, highlightKeyword)}
                        </span>
                        {data.type === "external" && (
                            <span style={{
                                fontSize: "10px",
                                padding: "2px 6px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                borderRadius: "4px",
                                marginLeft: "6px",
                                border: "1px solid #fecaca",
                                fontWeight: "600",
                                textTransform: "capitalize",
                                flexShrink: 0
                            }}>
                                {data.type}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(data.fileurl, "_blank", "noopener,noreferrer");
                        }}
                        title="Download File"
                        style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            background: "#f3f4f6", border: "1px solid #e5e7eb",
                            color: "#4b5563", borderRadius: "6px", width: "28px", height: "28px",
                            cursor: "pointer", transition: "0.2s", flexShrink: 0
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#7c3aed"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                    >
                        <FiDownload size={14} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "6px", marginLeft: level > 0 ? "16px" : "0" }}>
            <div 
                onClick={handleToggle}
                style={{ 
                    display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", 
                    padding: "8px 12px", background: expanded ? "#f5f3ff" : "#fff", 
                    border: "1px solid #eaeaea", borderRadius: "8px", transition: "0.2s",
                    fontWeight: expanded ? "600" : "500", color: "#333",
                    boxShadow: expanded ? "0 2px 8px rgba(124, 58, 237, 0.1)" : "none"
                }}
                onMouseOver={(e) => { if (!expanded) e.currentTarget.style.background = "#faf8ff"; }}
                onMouseOut={(e) => { if (!expanded) e.currentTarget.style.background = "#fff"; }}
            >
                <span style={{ display: "flex", alignItems: "center", color: "#6b7280" }}>
                    {expanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </span>
                <span style={{ display: "flex", alignItems: "center" }}>
                    <IconComponent size={16} color={iconColor} />
                </span>
                <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {highlightText(displayName, highlightKeyword)}
                </span>
            </div>

            {expanded && (
                <div style={{ borderLeft: "1px dashed #dcdcdc", marginLeft: "20px", paddingLeft: "10px", marginTop: "4px" }}>
                    {loading && page === 1 && (
                        <div style={{ fontSize: "12px", color: "#9ca3af", padding: "8px 12px", fontStyle: "italic" }}>Loading...</div>
                    )}

                    {!loading && children.length === 0 && (
                        <div style={{ fontSize: "12px", color: "#9ca3af", padding: "8px 12px", fontStyle: "italic" }}>No items found.</div>
                    )}

                    {type === "subject" ? (
                        <>
                            {/* External Resources Group */}
                            {children.some(c => c.type === "external") && (
                                <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                                    <button
                                        onClick={() => setExternalExpanded(!externalExpanded)}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            width: "100%", border: "1px solid #c084fc", background: "#faf5ff",
                                            borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                                            color: "#7e22ce", fontWeight: "600", fontSize: "12px"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <FiBookOpen size={14} />
                                            <span style={{ textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                                                External Resources
                                            </span>
                                            <span style={{
                                                background: "#c084fc", color: "#fff", fontSize: "10px",
                                                padding: "1px 5px", borderRadius: "10px"
                                            }}>
                                                {children.filter(c => c.type === "external").length}
                                            </span>
                                        </div>
                                        <div>
                                            {externalExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                        </div>
                                    </button>

                                    {externalExpanded && (
                                        <div style={{ borderLeft: "2px dashed #c084fc", marginLeft: "10px", paddingLeft: "8px", marginTop: "4px" }}>
                                            {children.filter(c => c.type === "external").map(child => (
                                                <SMAdminSearchDirectoryNode
                                                    key={child._id}
                                                    level={level + 2}
                                                    type="file"
                                                    data={child}
                                                    parentParams={nextParams}
                                                    highlightKeyword={highlightKeyword}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Official Files */}
                            {children.filter(c => c.type !== "external").map(child => (
                                <SMAdminSearchDirectoryNode
                                    key={child._id}
                                    level={level + 1}
                                    type="file"
                                    data={child}
                                    parentParams={nextParams}
                                    highlightKeyword={highlightKeyword}
                                />
                            ))}
                        </>
                    ) : (
                        children.map(child => (
                            <SMAdminSearchDirectoryNode
                                key={child._id}
                                level={level + 1}
                                type={nextType}
                                data={child}
                                parentParams={nextParams}
                                highlightKeyword={highlightKeyword}
                            />
                        ))
                    )}

                    {page < totalPages && (
                        <button 
                            onClick={handleLoadMore}
                            disabled={loading}
                            style={{
                                marginTop: "8px", marginLeft: "16px", background: "none", border: "none",
                                color: "#7c3aed", fontWeight: "600", cursor: "pointer", fontSize: "12px",
                                textDecoration: "underline", display: "inline-flex", alignItems: "center"
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

export default function SMAdminSearchResults({ searchQuery, onClearSearch }) {
    const categories = [
        { id: "universities", label: "Universities", endpoint: "/api/sm/v1/search/universities", type: "university" },
        { id: "colleges", label: "Colleges", endpoint: "/api/sm/v1/search/colleges", type: "college" },
        { id: "courses", label: "Courses", endpoint: "/api/sm/v1/search/courses", type: "course" },
        { id: "semesters", label: "Semesters", endpoint: "/api/sm/v1/search/semesters", type: "semester" },
        { id: "batches", label: "Batches", endpoint: "/api/sm/v1/search/batches", type: "batch" },
        { id: "subjects", label: "Subjects", endpoint: "/api/sm/v1/search/subjects", type: "subject" },
    ];

    const [state, setState] = useState({
        universities: { data: [], page: 1, totalPages: 1, loading: false, total: 0 },
        colleges: { data: [], page: 1, totalPages: 1, loading: false, total: 0 },
        courses: { data: [], page: 1, totalPages: 1, loading: false, total: 0 },
        semesters: { data: [], page: 1, totalPages: 1, loading: false, total: 0 },
        batches: { data: [], page: 1, totalPages: 1, loading: false, total: 0 },
        subjects: { data: [], page: 1, totalPages: 1, loading: false, total: 0 },
    });

    const fetchCategory = async (catId, pageNum, append = false) => {
        setState(prev => ({
            ...prev,
            [catId]: { ...prev[catId], loading: true }
        }));

        try {
            const cat = categories.find(c => c.id === catId);
            const res = await fetch(`${cat.endpoint}?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=20`);
            const json = await res.json();

            if (json.success) {
                setState(prev => {
                    const existingData = append ? prev[catId].data : [];
                    const newData = [...existingData, ...json.data];
                    const uniqueData = Array.from(new Map(newData.map(item => [item._id, item])).values());
                    
                    return {
                        ...prev,
                        [catId]: {
                            data: uniqueData,
                            page: pageNum,
                            totalPages: json.pagination.totalPages || 1,
                            total: json.pagination.total || uniqueData.length,
                            loading: false
                        }
                    };
                });
            } else {
                setState(prev => ({
                    ...prev,
                    [catId]: { ...prev[catId], loading: false }
                }));
            }
        } catch (error) {
            console.error(`Error fetching search category ${catId}:`, error);
            setState(prev => ({
                ...prev,
                [catId]: { ...prev[catId], loading: false }
            }));
        }
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            categories.forEach(cat => {
                fetchCategory(cat.id, 1, false);
            });
        }
    }, [searchQuery]);

    const handleLoadMore = (catId) => {
        const current = state[catId];
        if (current.page < current.totalPages && !current.loading) {
            fetchCategory(catId, current.page + 1, true);
        }
    };

    const hasAnyResults = categories.some(cat => state[cat.id].data.length > 0);
    const isLoadingAny = categories.some(cat => state[cat.id].loading && state[cat.id].page === 1);

    if (isLoadingAny) {
        return (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                <p>Searching all categories...</p>
            </div>
        );
    }

    if (!hasAnyResults) {
        return (
            <div style={{
                textAlign: "center", padding: "40px", color: "#6b7280", background: "#fdfbff",
                borderRadius: "12px", border: "1px dashed #d8b4fe", fontSize: "14px"
            }}>
                <p>No study materials matches found for "{searchQuery}"</p>
                <button 
                    onClick={onClearSearch}
                    style={{
                        marginTop: "12px",
                        background: "#7c3aed",
                        border: "none",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Clear Search
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
            {categories.map(cat => {
                const catState = state[cat.id];
                if (catState.data.length === 0) return null;

                return (
                    <div key={cat.id} style={{
                        background: "#fff", border: "1px solid #e9d5ff", borderRadius: "12px",
                        padding: "16px", boxShadow: "0 2px 6px rgba(124, 58, 237, 0.02)"
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            marginBottom: "12px", borderBottom: "1px solid #f3e8ff", paddingBottom: "8px"
                        }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4c1d95", margin: 0 }}>
                                {cat.label}
                                <span style={{
                                    fontSize: "11px", fontWeight: "600", color: "#7c3aed",
                                    background: "#f3e8ff", padding: "2px 6px", borderRadius: "6px", marginLeft: "8px"
                                }}>
                                    {catState.total} matches
                                </span>
                            </h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {catState.data.map(item => (
                                <SMAdminSearchDirectoryNode
                                    key={item._id}
                                    type={cat.type}
                                    data={item}
                                    highlightKeyword={searchQuery}
                                />
                            ))}
                        </div>

                        {catState.page < catState.totalPages && (
                            <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                                <button
                                    onClick={() => handleLoadMore(cat.id)}
                                    disabled={catState.loading}
                                    style={{
                                        height: "32px", border: "1px solid #d8b4fe", borderRadius: "6px",
                                        background: "#fff", color: "#7c3aed", padding: "0 12px",
                                        fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = "#f5f3ff"; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; }}
                                >
                                    {catState.loading ? "Loading..." : `View More ${cat.label}`}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
