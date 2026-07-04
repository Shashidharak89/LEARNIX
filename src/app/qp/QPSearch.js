"use client";

import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiChevronDown, FiChevronRight, FiFileText, FiExternalLink } from "react-icons/fi";
import "./styles/QuestionPapers.css";

export default function QPSearch() {
    const [query, setQuery] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [hasInitialFetched, setHasInitialFetched] = useState(false);
    
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [subjectImages, setSubjectImages] = useState({});
    const [loadingSubjectImages, setLoadingSubjectImages] = useState({});

    // Debounced search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchSubjects(1, query, true);
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchSubjects = async (pageNum, searchQuery, isNewSearch = false) => {
        setLoadingSubjects(true);
        try {
            const endpoint = searchQuery 
                ? `/api/qp/v1/search/subjects?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=20`
                : `/api/qp/v1/subjects?page=${pageNum}&limit=20`;
            
            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (json.success) {
                if (isNewSearch || pageNum === 1) {
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
        setHasInitialFetched(true);
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSubjects(nextPage, query, false);
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
                // Fetch images for the expanded subject
                const res = await fetch(`/api/qp/v1/images?subjectId=${subjectId}&limit=50`);
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

    const renderSubjectDetails = (subjectId) => {
        if (loadingSubjectImages[subjectId]) return <div style={{ padding: "15px", color: "#666", fontSize: "14px" }}>Loading question papers...</div>;
        
        const images = subjectImages[subjectId];
        if (!images || images.length === 0) return <div style={{ padding: "15px", color: "#666", fontSize: "14px" }}>No question papers available for this subject yet.</div>;

        // Group by batch and examType for clean presentation
        const grouped = {};
        images.forEach(imgRecord => {
            const batchName = imgRecord.batch ? `${imgRecord.batch.startYear}-${imgRecord.batch.endYear}` : "Unknown Batch";
            const examTypeName = imgRecord.examtype ? imgRecord.examtype.name : "Final";
            
            if (!grouped[batchName]) grouped[batchName] = {};
            if (!grouped[batchName][examTypeName]) grouped[batchName][examTypeName] = [];
            
            grouped[batchName][examTypeName].push(imgRecord);
        });

        return (
            <div className="qp-batches-container" style={{ padding: "15px" }}>
                {Object.entries(grouped).map(([batch, exams]) => (
                    <div key={batch} style={{ marginBottom: "20px" }}>
                        <div style={{ display: "inline-block", background: "#f2c200", color: "#111", padding: "6px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", marginBottom: "12px" }}>
                            Batch: {batch}
                        </div>
                        <div style={{ paddingLeft: "10px", borderLeft: "2px solid #eaeaea", marginLeft: "10px" }}>
                            {Object.entries(exams).map(([examType, records]) => (
                                <div key={examType} style={{ marginBottom: "15px" }}>
                                    <div style={{ display: "inline-block", background: "#0b74ff", color: "#fff", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                        {examType}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                                        {records.map(record => (
                                            record.imageUrls.map((url, i) => (
                                                <a 
                                                    key={`${record._id}-${i}`} href={url} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#0b74ff", border: "1px solid #0b74ff", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", background: "#f8faff", transition: "all 0.2s", fontWeight: "500" }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = "#0b74ff"; e.currentTarget.style.color = "#fff"; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.color = "#0b74ff"; }}
                                                >
                                                    <FiFileText size={16} /> View QP Part {i + 1}
                                                </a>
                                            ))
                                        ))}
                                        {records.map(record => (
                                            record.visitLink && record.visitLink.length > 0 && record.visitLink.map((link, i) => (
                                                <a 
                                                    key={`link-${record._id}-${i}`} href={`/works/${link}`} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#ff6b00", border: "1px solid #ff6b00", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", background: "#fff5f0", transition: "all 0.2s", fontWeight: "500" }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = "#ff6b00"; e.currentTarget.style.color = "#fff"; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = "#fff5f0"; e.currentTarget.style.color = "#ff6b00"; }}
                                                >
                                                    <FiExternalLink size={16} /> Visit Resources
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
        <div className="qp-page-container" style={{ paddingBottom: "10px", minHeight: "auto", marginTop: "30px" }}>
            <section className="qp-card qp-search-section">
                <div className="qp-section-header" style={{ marginBottom: "25px" }}>
                    <h2 style={{ fontSize: "24px", color: "#111", marginBottom: "8px" }}>Search Subjects</h2>
                    <p style={{ color: "#666", fontSize: "15px", margin: 0 }}>Instantly find and download question papers for any subject.</p>
                </div>
                
                {/* Search Bar at the Top */}
                <div style={{ position: "relative", marginBottom: "30px" }}>
                    <FiSearch style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "20px" }} />
                    <input 
                        type="text" 
                        placeholder="Search by subject name (e.g., Cloud Computing, Data Structures...)" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "16px 20px 16px 50px",
                            fontSize: "16px",
                            border: "2px solid #e1e4e8",
                            borderRadius: "12px",
                            outline: "none",
                            transition: "all 0.3s ease",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                            color: "#333",
                            fontWeight: "500"
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "#0b74ff";
                            e.target.style.boxShadow = "0 4px 15px rgba(11, 116, 255, 0.15)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "#e1e4e8";
                            e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                        }}
                    />
                </div>

                {/* List of Subjects Below */}
                <div className="qp-search-results">
                    {!hasInitialFetched && loadingSubjects ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "16px" }}>
                            <div className="loading-spinner" style={{ display: "inline-block", width: "30px", height: "30px", border: "3px solid #f3f3f3", borderTop: "3px solid #0b74ff", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "10px" }}></div>
                            <div>Loading latest subjects...</div>
                        </div>
                    ) : subjects.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "16px", background: "#f8f9fa", borderRadius: "12px", border: "1px dashed #ddd" }}>
                            No subjects found matching "{query}". Try a different keyword.
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {subjects.map(sub => {
                                    const isExpanded = expandedSubjects[sub._id];
                                    return (
                                        <div key={sub._id} style={{ border: "1px solid #eaeaea", borderRadius: "12px", overflow: "hidden", background: "#fff", transition: "all 0.2s", boxShadow: isExpanded ? "0 4px 15px rgba(0,0,0,0.05)" : "none" }}>
                                            <button 
                                                onClick={() => toggleSubject(sub._id)}
                                                style={{ 
                                                    width: "100%", 
                                                    display: "flex", 
                                                    justifyContent: "space-between", 
                                                    alignItems: "center", 
                                                    padding: "18px 20px", 
                                                    background: isExpanded ? "#f8faff" : "#fff", 
                                                    border: "none", 
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    transition: "background 0.2s"
                                                }}
                                            >
                                                <span style={{ fontSize: "16px", color: isExpanded ? "#0b74ff" : "#333", fontWeight: isExpanded ? "700" : "600" }}>{sub.name}</span>
                                                {isExpanded ? <FiChevronDown size={22} color="#0b74ff" /> : <FiChevronRight size={22} color="#888" />}
                                            </button>
                                            
                                            {isExpanded && (
                                                <div style={{ borderTop: "1px solid #eaeaea", background: "#fff" }}>
                                                    {renderSubjectDetails(sub._id)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* View More Button at End of List */}
                            {page < totalPages && (
                                <div style={{ textAlign: "center", marginTop: "30px" }}>
                                    <button 
                                        onClick={handleLoadMore}
                                        disabled={loadingSubjects}
                                        style={{
                                            background: loadingSubjects ? "#e9ecef" : "#f8f9fa",
                                            color: loadingSubjects ? "#888" : "#0b74ff",
                                            border: "1px solid #0b74ff",
                                            padding: "12px 30px",
                                            borderRadius: "8px",
                                            cursor: loadingSubjects ? "default" : "pointer",
                                            fontWeight: "600",
                                            fontSize: "15px",
                                            transition: "all 0.2s ease"
                                        }}
                                        onMouseOver={(e) => { if(!loadingSubjects) { e.target.style.background = "#0b74ff"; e.target.style.color = "#fff"; } }}
                                        onMouseOut={(e) => { if(!loadingSubjects) { e.target.style.background = "#f8f9fa"; e.target.style.color = "#0b74ff"; } }}
                                    >
                                        {loadingSubjects ? "Loading more..." : "View More Subjects"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
