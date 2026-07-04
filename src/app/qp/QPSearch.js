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
                                    return (
                                        <div key={sub._id} style={{ border: "1px solid #eaeaea", borderRadius: "12px", overflow: "hidden", background: "#fff", transition: "all 0.2s", boxShadow: "none" }}>
                                            <a 
                                                href={`/qp/${sub._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ 
                                                    width: "100%", 
                                                    display: "flex", 
                                                    justifyContent: "space-between", 
                                                    alignItems: "center", 
                                                    padding: "18px 20px", 
                                                    background: "#fff", 
                                                    border: "none", 
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    textDecoration: "none",
                                                    transition: "background 0.2s"
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = "#f8faff"; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; }}
                                            >
                                                <span style={{ fontSize: "16px", color: "#333", fontWeight: "600" }}>{sub.name}</span>
                                                <FiExternalLink size={20} color="#888" />
                                            </a>
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
