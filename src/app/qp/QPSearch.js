"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiChevronDown, FiChevronRight, FiFileText, FiExternalLink, FiFolder, FiBookOpen } from "react-icons/fi";
import "./styles/QuestionPapers.css";

// Recursive component for Tree View
const TreeNode = ({ node, level, fetchChildren, renderChildren }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [children, setChildren] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!isExpanded && !children) {
            setLoading(true);
            const data = await fetchChildren(node, level);
            setChildren(data);
            setLoading(false);
        }
        setIsExpanded(!isExpanded);
    };

    const getIcon = () => {
        if (level === "images") return <FiFileText color="#0b74ff" />;
        return isExpanded ? <FiChevronDown /> : <FiChevronRight />;
    };

    const getDisplayName = () => {
        if (level === "universities" || level === "colleges" || level === "courses" || level === "exams") return node.name;
        if (level === "semesters") return `Semester ${node.semesterNumber}`;
        if (level === "batches") return `${node.startYear}-${node.endYear}`;
        if (level === "images") return node.subject?.name || "Unknown Subject";
        return "Unknown Node";
    };

    return (
        <div style={{ marginLeft: level === "universities" ? 0 : "20px", marginTop: "5px" }}>
            <div 
                onClick={level === "images" ? null : handleToggle}
                style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "8px 12px", 
                    background: isExpanded ? "#f8f9fa" : "#fff",
                    border: "1px solid #eaeaea",
                    borderRadius: "6px",
                    cursor: level === "images" ? "default" : "pointer",
                    transition: "background 0.2s"
                }}
            >
                {getIcon()}
                <span style={{ fontWeight: isExpanded && level !== "images" ? "bold" : "normal", fontSize: "15px" }}>
                    {getDisplayName()}
                </span>
                
                {level === "images" && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                        {node.imageUrls && node.imageUrls.map((url, i) => (
                            <a 
                                key={i} href={url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: "12px", color: "#0b74ff", textDecoration: "none", border: "1px solid #0b74ff", padding: "2px 8px", borderRadius: "4px" }}
                            >
                                QP {i + 1}
                            </a>
                        ))}
                        {node.visitLink && node.visitLink.map((link, i) => (
                            <a 
                                key={i} href={`/works/${link}`} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: "12px", color: "#ff6b00", textDecoration: "none", border: "1px solid #ff6b00", padding: "2px 8px", borderRadius: "4px" }}
                            >
                                Visit
                            </a>
                        ))}
                    </div>
                )}
            </div>
            
            {isExpanded && loading && <div style={{ marginLeft: "30px", padding: "5px", fontSize: "13px", color: "#666" }}>Loading...</div>}
            
            {isExpanded && children && children.length === 0 && level !== "images" && (
                <div style={{ marginLeft: "30px", padding: "5px", fontSize: "13px", color: "#666" }}>No data found.</div>
            )}

            {isExpanded && children && children.length > 0 && (
                <div>{renderChildren(children, node, level)}</div>
            )}
        </div>
    );
};


export default function QPSearch() {
    const [activeTab, setActiveTab] = useState("tree");

    // Subject Search State
    const [query, setQuery] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [subjectImages, setSubjectImages] = useState({});
    const [loadingSubjectImages, setLoadingSubjectImages] = useState({});

    // Tree View State
    const [universities, setUniversities] = useState([]);
    const [loadingTree, setLoadingTree] = useState(false);

    // Initial load
    useEffect(() => {
        if (activeTab === "tree" && universities.length === 0) {
            fetchTreeData(null, null, "root");
        } else if (activeTab === "search" && subjects.length === 0) {
            fetchSubjects(1, query);
        }
    }, [activeTab]);

    // Search Debounce
    useEffect(() => {
        if (activeTab === "search") {
            const timer = setTimeout(() => {
                setPage(1);
                fetchSubjects(1, query);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [query]);

    // --- Tree Logic ---
    const fetchTreeData = async (parentNode, currentLevel, targetLevel) => {
        try {
            let endpoint = `/api/qp/v1/tree/dynamic?level=${targetLevel}`;
            
            if (targetLevel === "colleges") endpoint += `&universityId=${parentNode._id}`;
            if (targetLevel === "courses") endpoint += `&collegeId=${parentNode._id}`;
            if (targetLevel === "semesters") endpoint += `&collegeId=${parentNode.collegeId}&courseId=${parentNode._id}`;
            if (targetLevel === "batches") endpoint += `&collegeId=${parentNode.collegeId}&courseId=${parentNode.courseId}&semesterId=${parentNode._id}`;
            if (targetLevel === "exams") endpoint += `&collegeId=${parentNode.collegeId}&courseId=${parentNode.courseId}&semesterId=${parentNode.semesterId}&batchId=${parentNode._id}`;
            if (targetLevel === "images") endpoint += `&collegeId=${parentNode.collegeId}&courseId=${parentNode.courseId}&semesterId=${parentNode.semesterId}&batchId=${parentNode.batchId}&examId=${parentNode._id}`;

            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (targetLevel === "universities" || targetLevel === "root") {
                setUniversities(json.data);
                return json.data;
            }
            
            // Pass down parent IDs so we can keep building the query string deeper
            if (json.success && json.data) {
                return json.data.map(item => ({
                    ...item,
                    collegeId: targetLevel === "colleges" ? item._id : parentNode.collegeId,
                    courseId: targetLevel === "courses" ? item._id : parentNode.courseId,
                    semesterId: targetLevel === "semesters" ? item._id : parentNode.semesterId,
                    batchId: targetLevel === "batches" ? item._id : parentNode.batchId,
                }));
            }
            return [];
        } catch (err) {
            console.error("Error fetching tree node", err);
            return [];
        }
    };

    const fetchTreeChildren = async (node, level) => {
        if (level === "universities") return fetchTreeData(node, level, "colleges");
        if (level === "colleges") return fetchTreeData({ ...node, collegeId: node._id }, level, "courses");
        if (level === "courses") return fetchTreeData(node, level, "semesters");
        if (level === "semesters") return fetchTreeData(node, level, "batches");
        if (level === "batches") return fetchTreeData(node, level, "exams");
        if (level === "exams") return fetchTreeData(node, level, "images");
        return [];
    };

    const renderTreeChildren = (children, parentNode, parentLevel) => {
        let childLevel = "universities";
        if (parentLevel === "universities") childLevel = "colleges";
        if (parentLevel === "colleges") childLevel = "courses";
        if (parentLevel === "courses") childLevel = "semesters";
        if (parentLevel === "semesters") childLevel = "batches";
        if (parentLevel === "batches") childLevel = "exams";
        if (parentLevel === "exams") childLevel = "images";

        return children.map(child => (
            <TreeNode 
                key={child._id} 
                node={child} 
                level={childLevel} 
                fetchChildren={fetchTreeChildren} 
                renderChildren={renderTreeChildren} 
            />
        ));
    };


    // --- Search Logic ---
    const fetchSubjects = async (pageNum, searchQuery) => {
        setLoadingSubjects(true);
        try {
            const endpoint = searchQuery 
                ? `/api/qp/v1/search/subjects?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=20`
                : `/api/qp/v1/subjects?page=${pageNum}&limit=20`;
            
            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (json.success) {
                if (pageNum === 1) {
                    setSubjects(json.data);
                } else {
                    setSubjects(prev => [...prev, ...json.data]);
                }
                setTotalPages(json.pagination.totalPages);
            }
        } catch (err) {
            console.error("Error fetching subjects:", err);
        }
        setLoadingSubjects(false);
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSubjects(nextPage, query);
        }
    };

    const toggleSubject = async (subjectId) => {
        const isExpanded = !!expandedSubjects[subjectId];
        
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectId]: !isExpanded
        }));

        if (!isExpanded && !subjectImages[subjectId]) {
            setLoadingSubjectImages(prev => ({ ...prev, [subjectId]: true }));
            try {
                const res = await fetch(`/api/qp/v1/images?subjectId=${subjectId}&limit=100`);
                const json = await res.json();
                if (json.success) {
                    setSubjectImages(prev => ({
                        ...prev,
                        [subjectId]: json.data
                    }));
                }
            } catch (err) {
                console.error("Failed to load images", err);
            }
            setLoadingSubjectImages(prev => ({ ...prev, [subjectId]: false }));
        }
    };

    const renderSubjectTree = (subjectId) => {
        if (loadingSubjectImages[subjectId]) return <div style={{ padding: "10px", color: "#666" }}>Loading question papers...</div>;
        
        const images = subjectImages[subjectId];
        if (!images || images.length === 0) return <div style={{ padding: "10px", color: "#666" }}>No question papers available for this subject yet.</div>;

        const grouped = {};
        images.forEach(imgRecord => {
            const batchName = imgRecord.batch ? `${imgRecord.batch.startYear}-${imgRecord.batch.endYear}` : "Unknown Batch";
            const examTypeName = imgRecord.examtype ? imgRecord.examtype.name : "Final";
            
            if (!grouped[batchName]) grouped[batchName] = {};
            if (!grouped[batchName][examTypeName]) grouped[batchName][examTypeName] = [];
            
            grouped[batchName][examTypeName].push(imgRecord);
        });

        return (
            <div className="qp-batches-container" style={{ padding: "10px 0 10px 20px" }}>
                {Object.entries(grouped).map(([batch, exams]) => (
                    <div key={batch} style={{ marginBottom: "15px" }}>
                        <div style={{ display: "inline-block", background: "#f2c200", color: "#111", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                            Batch: {batch}
                        </div>
                        <div style={{ paddingLeft: "15px" }}>
                            {Object.entries(exams).map(([examType, records]) => (
                                <div key={examType} style={{ marginBottom: "10px" }}>
                                    <div style={{ display: "inline-block", background: "#0b74ff", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>
                                        {examType}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                                        {records.map(record => (
                                            record.imageUrls.map((url, i) => (
                                                <a 
                                                    key={`${record._id}-${i}`} href={url} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none", color: "#0b74ff", border: "1px solid #0b74ff", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", background: "#f8faff", transition: "all 0.2s" }}
                                                >
                                                    <FiFileText /> View QP Part {i + 1}
                                                </a>
                                            ))
                                        ))}
                                        {records.map(record => (
                                            record.visitLink && record.visitLink.length > 0 && record.visitLink.map((link, i) => (
                                                <a 
                                                    key={`link-${record._id}-${i}`} href={`/works/${link}`} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none", color: "#ff6b00", border: "1px solid #ff6b00", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", background: "#fff5f0", transition: "all 0.2s" }}
                                                >
                                                    <FiExternalLink /> Visit Resources
                                                </a>
                                            ))
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="qp-page-container" style={{ paddingBottom: 0, minHeight: 'auto' }}>
            <section className="qp-card qp-search-section" style={{ marginBottom: "30px" }}>
                <div className="qp-section-header">
                    <h2>Question Paper Explorer</h2>
                    <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Browse the hierarchy or search for specific subjects.</p>
                </div>
                
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "2px solid #eaeaea", marginBottom: "20px" }}>
                    <button 
                        onClick={() => setActiveTab("tree")}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            background: "transparent",
                            fontSize: "15px",
                            fontWeight: activeTab === "tree" ? "bold" : "normal",
                            color: activeTab === "tree" ? "#0b74ff" : "#666",
                            borderBottom: activeTab === "tree" ? "2px solid #0b74ff" : "2px solid transparent",
                            marginBottom: "-2px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <FiFolder /> Browse by Hierarchy
                    </button>
                    <button 
                        onClick={() => setActiveTab("search")}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            background: "transparent",
                            fontSize: "15px",
                            fontWeight: activeTab === "search" ? "bold" : "normal",
                            color: activeTab === "search" ? "#0b74ff" : "#666",
                            borderBottom: activeTab === "search" ? "2px solid #0b74ff" : "2px solid transparent",
                            marginBottom: "-2px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <FiSearch /> Search Subjects
                    </button>
                </div>

                {activeTab === "tree" && (
                    <div className="qp-tree-results" style={{ padding: "10px 0" }}>
                        <div style={{ position: "relative", marginBottom: "20px", width: "100%" }}>
                             <FiSearch style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                             <input 
                                 type="text" 
                                 placeholder="Search anything (Coming soon...)" 
                                 disabled
                                 style={{
                                     width: "100%", padding: "12px 14px 12px 45px", fontSize: "15px",
                                     border: "2px solid #e1e4e8", borderRadius: "8px", background: "#f8f9fa", outline: "none"
                                 }}
                             />
                        </div>

                        {loadingTree ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>Loading hierarchy...</div>
                        ) : universities.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>No universities found.</div>
                        ) : (
                            universities.map(uni => (
                                <TreeNode 
                                    key={uni._id} 
                                    node={uni} 
                                    level="universities" 
                                    fetchChildren={fetchTreeChildren} 
                                    renderChildren={renderTreeChildren} 
                                />
                            ))
                        )}
                    </div>
                )}
                
                {activeTab === "search" && (
                    <div className="qp-search-results">
                        <div style={{ position: "relative", marginBottom: "20px" }}>
                            <FiSearch style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                            <input 
                                type="text" 
                                placeholder="Search by subject name (e.g. Data Structures, Java...)" 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{
                                    width: "100%", padding: "14px 14px 14px 45px", fontSize: "16px",
                                    border: "2px solid #e1e4e8", borderRadius: "10px", outline: "none", transition: "border-color 0.3s"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#0b74ff"}
                                onBlur={(e) => e.target.style.borderColor = "#e1e4e8"}
                            />
                        </div>

                        {loadingSubjects && page === 1 ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>Searching...</div>
                        ) : subjects.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>No subjects found. Try a different search term.</div>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {subjects.map(sub => {
                                        const isExpanded = expandedSubjects[sub._id];
                                        return (
                                            <div key={sub._id} style={{ border: "1px solid #eaeaea", borderRadius: "8px", overflow: "hidden" }}>
                                                <button 
                                                    onClick={() => toggleSubject(sub._id)}
                                                    style={{ 
                                                        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", 
                                                        padding: "15px", background: isExpanded ? "#f8f9fa" : "#fff", border: "none", 
                                                        cursor: "pointer", textAlign: "left", fontWeight: isExpanded ? "bold" : "normal", transition: "background 0.2s"
                                                    }}
                                                >
                                                    <span style={{ fontSize: "16px", color: "#333" }}>{sub.name}</span>
                                                    {isExpanded ? <FiChevronDown size={20} color="#666" /> : <FiChevronRight size={20} color="#666" />}
                                                </button>
                                                
                                                {isExpanded && (
                                                    <div style={{ borderTop: "1px solid #eaeaea", background: "#fff", padding: "10px 15px" }}>
                                                        {renderSubjectTree(sub._id)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {page < totalPages && (
                                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                                        <button 
                                            onClick={handleLoadMore}
                                            disabled={loadingSubjects}
                                            style={{
                                                background: "#f1f3f5", color: "#333", border: "1px solid #ddd", padding: "10px 24px",
                                                borderRadius: "6px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s"
                                            }}
                                            onMouseOver={(e) => e.target.style.background = "#e9ecef"}
                                            onMouseOut={(e) => e.target.style.background = "#f1f3f5"}
                                        >
                                            {loadingSubjects ? "Loading..." : "View More Subjects"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

