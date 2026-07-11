"use client";

import React, { useState, useEffect } from "react";
import { FiFileText, FiSearch } from "react-icons/fi";
import SMDirectoryNode from "./SMDirectoryNode";
import SMAdminSearchResults from "./SMAdminSearchResults";
import "./SMViewer.css";

export default function SMViewer() {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeQuery, setActiveQuery] = useState("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setActiveQuery(searchQuery);
            setPage(1);
        }, 400);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchData = async (pageNum, queryText, append = false) => {
        if (queryText.trim()) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError("");
        try {
            let url = `/api/sm/v1/universities?page=${pageNum}&limit=20`;

            const res = await fetch(url, { cache: "no-store" });
            const json = await res.json();

            if (json.success) {
                if (append) {
                    setUniversities(prev => [...prev, ...json.data]);
                } else {
                    setUniversities(json.data);
                }
                setTotalPages(json.pagination.totalPages || 1);
            } else {
                setError(json.error || "Failed to load directory data");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    // Refetch when search query triggers change
    useEffect(() => {
        fetchData(1, activeQuery, false);
    }, [activeQuery]);

    const handleLoadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchData(nextPage, activeQuery, true);
        }
    };

    return (
        <section className="sm-viewer-section" aria-labelledby="sm-papers-section">
            <div className="sm-section-header">
                <FiFileText className="sm-section-icon" />
                <h2 id="sm-papers-section" className="sm-subtitle">Browse Study Materials Directory</h2>
            </div>
            
            {/* Search Bar */}
            <div style={{ 
                marginBottom: "20px", 
                display: "flex", 
                gap: "10px",
                background: "#fff",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #e9d5ff",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.05)"
            }}>
                <div style={{ 
                    position: "relative", 
                    flex: 1, 
                    display: "flex", 
                    alignItems: "center" 
                }}>
                    <FiSearch style={{ 
                        position: "absolute", 
                        left: "14px", 
                        color: "#7c3aed", 
                        fontSize: "18px" 
                    }} />
                    <input
                        type="text"
                        placeholder="Search by University, College, Course, Semester, Batch, Subject or File..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 16px 10px 42px",
                            borderRadius: "8px",
                            border: "1px solid #d8b4fe",
                            outline: "none",
                            fontSize: "14px",
                            background: "#fdfbff",
                            color: "#374151",
                            transition: "all 0.2s"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                        onBlur={(e) => e.target.style.borderColor = "#d8b4fe"}
                    />
                </div>
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                            padding: "0 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            transition: "0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#fca5a5"}
                        onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="sm-content" style={{ padding: "16px", background: "#fdfbff", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
                {activeQuery.trim() ? (
                    <SMAdminSearchResults 
                        searchQuery={activeQuery} 
                        onClearSearch={() => {
                            setSearchQuery("");
                            setActiveQuery("");
                        }} 
                    />
                ) : loading && page === 1 ? (
                    <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>Loading directory...</p>
                ) : error ? (
                    <p style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</p>
                ) : universities.length > 0 ? (
                    <div>
                        {universities.map(uni => (
                            <SMDirectoryNode 
                                key={uni._id} 
                                type="university" 
                                data={uni} 
                                searchActive={activeQuery.trim().length > 0}
                                highlightKeyword={activeQuery}
                            />
                        ))}
                        
                        {page < totalPages && (
                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    style={{
                                        background: loading ? "#f3e8ff" : "#fff",
                                        color: loading ? "#888" : "#7c3aed",
                                        border: "1px solid #7c3aed",
                                        padding: "8px 20px",
                                        borderRadius: "6px",
                                        cursor: loading ? "default" : "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    {loading ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>No study materials found matching "{activeQuery}".</p>
                )}
            </div>
        </section>
    );
}
