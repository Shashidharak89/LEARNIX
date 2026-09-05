"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiChevronDown, FiFolder, FiFileText, FiDownload, FiStar } from "react-icons/fi";

const hasMatchingDescendant = (node, type, query) => {
    if (!query) return false;
    const term = query.toLowerCase();

    const matchesNode = (n, t) => {
        let name = n.name || "";
        if (t === "semester") name = `Semester ${n.sem}`;
        if (t === "batch") name = `Batch ${n.startyear}-${n.endyear}`;
        if (t === "file") {
            const raw = n.name || n.fileurl.split("/").pop().split("?")[0];
            name = decodeURIComponent(raw);
        }
        return name.toLowerCase().includes(term);
    };

    if (!node.children || node.children.length === 0) return false;

    let nextType = "file";
    if (type === "university") nextType = "college";
    else if (type === "college") nextType = "course";
    else if (type === "course") nextType = "semester";
    else if (type === "semester") nextType = "batch";
    else if (type === "batch") nextType = "subject";

    for (const child of node.children) {
        if (matchesNode(child, nextType)) {
            return true;
        }
        if (hasMatchingDescendant(child, nextType, query)) {
            return true;
        }
    }
    return false;
};

export default function SMDirectoryNode({ 
    level = 0, 
    type = "university", 
    data, 
    parentParams = {},
    searchActive = false,
    highlightKeyword = "",
}) {
    const [expanded, setExpanded] = useState(false);
    const [externalExpanded, setExternalExpanded] = useState(false);
    const [children, setChildren] = useState(data.children || []);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const prefId = `${type}_${data._id}`;
    const [isPreferred, setIsPreferred] = useState(false);

    const checkPreferenceState = () => {
        if (typeof window !== "undefined") {
            try {
                const list = JSON.parse(localStorage.getItem("sm_user_preferences") || "[]");
                setIsPreferred(list.some(p => p.id === prefId));
            } catch (e) {
                setIsPreferred(false);
            }
        }
    };

    useEffect(() => {
        checkPreferenceState();
        const handleUpdate = () => checkPreferenceState();
        window.addEventListener("sm_preference_updated", handleUpdate);
        return () => window.removeEventListener("sm_preference_updated", handleUpdate);
    }, [prefId]);

    const handleTogglePreference = (e) => {
        e.stopPropagation();
        if (typeof window !== "undefined") {
            try {
                let list = JSON.parse(localStorage.getItem("sm_user_preferences") || "[]");
                const index = list.findIndex(p => p.id === prefId);
                if (index > -1) {
                    list.splice(index, 1);
                } else {
                    let displayName = data.name;
                    if (type === "semester") displayName = `Semester ${data.sem}`;
                    if (type === "batch") displayName = `Batch ${data.startyear}-${data.endyear}`;
                    
                    let subtitle = type.toUpperCase();
                    if (type === "subject") subtitle = "SUBJECT";

                    const newPref = {
                        id: prefId,
                        type,
                        data,
                        parentParams,
                        title: displayName,
                        subtitle
                    };
                    list.push(newPref);
                }
                localStorage.setItem("sm_user_preferences", JSON.stringify(list));
                window.dispatchEvent(new Event("sm_preference_updated"));
            } catch (err) {
                console.error("Failed to update preference", err);
            }
        }
    };

    React.useEffect(() => {
        if (searchActive) {
            const exp = hasMatchingDescendant(data, type, highlightKeyword);
            setExpanded(exp);
            const extExp = (data.children || []).some(c => 
                c.type === "external" && 
                decodeURIComponent(c.name || c.fileurl.split("/").pop().split("?")[0]).toLowerCase().includes(highlightKeyword.toLowerCase())
            );
            setExternalExpanded(extExp);
        } else {
            setExpanded(false);
            setExternalExpanded(false);
        }
    }, [searchActive, data, highlightKeyword]);

    React.useEffect(() => {
        if (data.children) {
            setChildren(data.children);
        } else if (!searchActive) {
            setChildren([]);
        }
    }, [data.children, searchActive]);

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
    if (type === "file") {
        const raw = data.name || data.fileurl.split("/").pop().split("?")[0];
        displayName = decodeURIComponent(raw);
    }

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

    return (
        <div className="sm-tree-node" style={{ marginLeft: level > 0 ? undefined : "0", marginTop: "8px" }}>
            {type !== "file" ? (
                <>
                    <div 
                        onClick={handleToggle}
                        style={{ 
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", cursor: "pointer", 
                            padding: "8px 12px", background: expanded ? "#f5f3ff" : "#fff", 
                            border: "1px solid #eaeaea", borderRadius: "8px", transition: "0.2s",
                            fontWeight: expanded ? "600" : "500", color: "#333",
                            boxShadow: expanded ? "0 2px 8px rgba(124, 58, 237, 0.1)" : "none"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                            {expanded ? <FiChevronDown color="#7c3aed" /> : <FiChevronRight color="#888" />}
                            <FiFolder color={expanded ? "#7c3aed" : "#a78bfa"} />
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {highlightText(displayName, highlightKeyword)}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleTogglePreference}
                            className={`sm-tree-pref-btn ${isPreferred ? "active" : ""}`}
                            title={isPreferred ? "Remove from preferences" : "Set as preference"}
                        >
                            <FiStar size={13} fill={isPreferred ? "#7c3aed" : "none"} color={isPreferred ? "#7c3aed" : "#9ca3af"} />
                            <span className="sm-tree-pref-text">{isPreferred ? "Preferred" : "Set Preference"}</span>
                        </button>
                    </div>

                    {expanded && (
                        <div className="sm-tree-children">
                            {loading && page === 1 && (
                                <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>Loading...</div>
                            )}
                            
                            {!loading && children.length === 0 && (
                                <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>No items found.</div>
                            )}

                            {type === "subject" ? (
                                <>
                                    {/* ── Unofficial Resources (External Files Group) ── */}
                                    {children.some(c => c.type === "external") && (
                                        <div className="sm-tree-ext-group">
                                            <button
                                                onClick={() => setExternalExpanded(!externalExpanded)}
                                                style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    width: "100%", border: "1px solid #c084fc", background: "#faf5ff",
                                                    borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
                                                    color: "#7e22ce", fontWeight: "600", fontSize: "13px"
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                        External Resources
                                                    </span>
                                                    <span style={{
                                                        background: "#c084fc", color: "#fff", fontSize: "11px",
                                                        padding: "2px 6px", borderRadius: "12px"
                                                    }}>
                                                        {children.filter(c => c.type === "external").length} files
                                                    </span>
                                                </div>
                                                <div>
                                                    {externalExpanded ? (
                                                        <span style={{ fontSize: "12px" }}>▼</span>
                                                    ) : (
                                                        <span style={{ fontSize: "12px" }}>▶</span>
                                                    )}
                                                </div>
                                            </button>

                                            {externalExpanded && (
                                                <div className="sm-tree-ext-children">
                                                    {children.filter(c => c.type === "external").map(child => (
                                                        <SMDirectoryNode
                                                            key={child._id}
                                                            level={level + 2}
                                                            type="file"
                                                            data={child}
                                                            parentParams={nextParams}
                                                            searchActive={searchActive}
                                                            highlightKeyword={highlightKeyword}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Official (Default) Files ── */}
                                    {children.filter(c => c.type !== "external").map(child => (
                                        <SMDirectoryNode
                                            key={child._id}
                                            level={level + 1}
                                            type="file"
                                            data={child}
                                            parentParams={nextParams}
                                            searchActive={searchActive}
                                            highlightKeyword={highlightKeyword}
                                        />
                                    ))}
                                </>
                            ) : (
                                children.map(child => (
                                    <SMDirectoryNode
                                        key={child._id}
                                        level={level + 1}
                                        type={nextType || "file"}
                                        data={child}
                                        parentParams={nextParams}
                                        searchActive={searchActive}
                                        highlightKeyword={highlightKeyword}
                                    />
                                ))
                            )}

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
                    <div 
                        onClick={() => {
                            const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(data.fileurl)}`;
                            window.open(viewUrl, "_blank", "noopener,noreferrer");
                        }}
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
                                {highlightText(displayName, highlightKeyword)}
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
            )}
        </div>
    );
}
