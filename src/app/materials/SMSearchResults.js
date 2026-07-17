"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight,
    ChevronDown,
    BookOpen,
    FileText,
    Download,
    FolderOpen,
    Folder,
    Share2,
    GraduationCap,
    Calendar,
    Users,
    Award,
    BookMarked,
    Eye
} from "lucide-react";

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

function SMSearchDirectoryNode({
    level = 0,
    type = "university",
    data,
    parentParams = {},
    highlightKeyword = "",
    onShareFile,
    highlightedFileKey
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
    let IconComponent = Folder;
    let iconColor = "#3b82f6"; // blue

    if (type === "university") {
        IconComponent = GraduationCap;
        iconColor = "#2563eb";
    } else if (type === "college") {
        IconComponent = Award;
        iconColor = "#7c3aed";
    } else if (type === "course") {
        IconComponent = BookOpen;
        iconColor = "#059669";
    } else if (type === "semester") {
        displayName = `Semester ${data.sem}`;
        IconComponent = Calendar;
        iconColor = "#d97706";
    } else if (type === "batch") {
        displayName = `Batch ${data.startyear}-${data.endyear}`;
        IconComponent = Users;
        iconColor = "#0891b2";
    } else if (type === "subject") {
        IconComponent = FolderOpen;
        iconColor = "#4f46e5";
    }

    if (type === "file") {
        const rawFileName = data.name || data.fileurl.split("/").pop().split("?")[0];
        const fileName = decodeURIComponent(rawFileName);
        const encodedUrl = encodeURIComponent(data.fileurl);
        const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
        const isHighlighted = highlightedFileKey === data._id;

        return (
            <div className={`sm-file-card ${isHighlighted ? "sm-file-card-highlighted" : ""}`} style={{ marginLeft: "20px", marginTop: "4px", marginBottom: "4px" }}>
                <a
                    href={viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sm-file-link"
                    title="Click to view file"
                    aria-label={`View ${fileName}`}
                >
                    <div className="sm-file-info">
                        <FileText size={16} color="#7c3aed" style={{ marginRight: "6px" }} />
                        <span className="sm-file-name">{highlightText(fileName, highlightKeyword)}</span>
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
                            }}>
                                {data.type}
                            </span>
                        )}
                    </div>
                </a>
                <div className="sm-file-actions">
                    <button
                        type="button"
                        className="sm-action-btn sm-share-btn"
                        title="Share file link"
                        aria-label={`Share ${fileName}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onShareFile(data._id, fileName);
                        }}
                    >
                        <Share2 size={14} />
                    </button>
                    <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sm-action-btn sm-view-btn"
                        title="View file"
                        aria-label={`View ${fileName}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Eye size={14} />
                    </a>
                    <a
                        href={data.fileurl}
                        target="_blank"
                        rel="noreferrer"
                        className="sm-action-btn sm-download-btn"
                        title="Download file"
                        aria-label={`Download ${fileName}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download size={14} />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="sm-search-node" style={{ marginLeft: level > 0 ? "16px" : "0" }}>
            <div
                onClick={handleToggle}
                className={`sm-search-node-header ${expanded ? "node-expanded" : ""}`}
            >
                <span className="sm-search-node-chevron">
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <span className="sm-search-node-icon">
                    <IconComponent size={16} color={iconColor} />
                </span>
                <span className="sm-search-node-title">
                    {highlightText(displayName, highlightKeyword)}
                </span>
            </div>

            {expanded && (
                <div className="sm-search-node-children">
                    {loading && page === 1 && (
                        <div className="sm-search-node-loading">Loading...</div>
                    )}

                    {!loading && children.length === 0 && (
                        <div className="sm-search-node-loading">No items found.</div>
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
                                            <BookMarked size={14} />
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
                                            {externalExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                    </button>

                                    {externalExpanded && (
                                        <div style={{ borderLeft: "2px dashed #c084fc", marginLeft: "10px", paddingLeft: "8px", marginTop: "4px" }}>
                                            {children.filter(c => c.type === "external").map(child => (
                                                <SMSearchDirectoryNode
                                                    key={child._id}
                                                    level={level + 2}
                                                    type="file"
                                                    data={child}
                                                    parentParams={nextParams}
                                                    highlightKeyword={highlightKeyword}
                                                    onShareFile={onShareFile}
                                                    highlightedFileKey={highlightedFileKey}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Official Files */}
                            {children.filter(c => c.type !== "external").map(child => (
                                <SMSearchDirectoryNode
                                    key={child._id}
                                    level={level + 1}
                                    type="file"
                                    data={child}
                                    parentParams={nextParams}
                                    highlightKeyword={highlightKeyword}
                                    onShareFile={onShareFile}
                                    highlightedFileKey={highlightedFileKey}
                                />
                            ))}
                        </>
                    ) : (
                        children.map(child => (
                            <SMSearchDirectoryNode
                                key={child._id}
                                level={level + 1}
                                type={nextType}
                                data={child}
                                parentParams={nextParams}
                                highlightKeyword={highlightKeyword}
                                onShareFile={onShareFile}
                                highlightedFileKey={highlightedFileKey}
                            />
                        ))
                    )}

                    {page < totalPages && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loading}
                            style={{
                                marginTop: "8px", marginLeft: "16px", background: "none", border: "none",
                                color: "#fbbf24", fontWeight: "600", cursor: "pointer", fontSize: "12px",
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

export default function SMSearchResults({ searchQuery, onClearSearch, onShareFile, highlightedFileKey }) {
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
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                <p>Searching all categories...</p>
            </div>
        );
    }

    if (!hasAnyResults) {
        return (
            <div className="sm-no-results">
                <p>No study materials matches found for "{searchQuery}"</p>
                <button
                    onClick={onClearSearch}
                    style={{
                        marginTop: "12px",
                        background: "#fbbf24",
                        border: "none",
                        color: "#111827",
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
        <div className="sm-search-results">
            {categories.map(cat => {
                const catState = state[cat.id];
                if (catState.data.length === 0) return null;

                return (
                    <div key={cat.id} className="sm-search-category">
                        <div className="sm-search-cat-header">
                            <h3 className="sm-search-cat-title">
                                {cat.label}
                                <span className="sm-search-cat-count">{catState.total} matches</span>
                            </h3>
                        </div>
                        <div className="sm-search-cat-list">
                            {catState.data.map(item => (
                                <SMSearchDirectoryNode
                                    key={item._id}
                                    type={cat.type}
                                    data={item}
                                    highlightKeyword={searchQuery}
                                    onShareFile={onShareFile}
                                    highlightedFileKey={highlightedFileKey}
                                />
                            ))}
                        </div>

                        {catState.page < catState.totalPages && (
                            <div className="sm-search-load-more-container">
                                <button
                                    onClick={() => handleLoadMore(cat.id)}
                                    disabled={catState.loading}
                                    className="sm-search-view-more-btn"
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
