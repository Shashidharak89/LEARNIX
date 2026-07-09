"use client";

import React, { useState, useEffect } from "react";
import { FiFileText } from "react-icons/fi";
import SMDirectoryNode from "./SMDirectoryNode";
import "./SMViewer.css";

export default function SMViewer() {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUniversities = async (pageNum, append = false) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sm/v1/universities?page=${pageNum}&limit=20`, { cache: "no-store" });
            const json = await res.json();
            if (json.success) {
                if (append) {
                    setUniversities(prev => [...prev, ...json.data]);
                } else {
                    setUniversities(json.data);
                }
                setTotalPages(json.pagination.totalPages);
            } else {
                setError(json.error || "Failed to load universities");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUniversities(1);
    }, []);

    const handleLoadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchUniversities(nextPage, true);
        }
    };

    return (
        <section className="sm-viewer-section" aria-labelledby="sm-papers-section">
            <div className="sm-section-header">
                <FiFileText className="sm-section-icon" />
                <h2 id="sm-papers-section" className="sm-subtitle">Browse Study Materials Directory</h2>
            </div>
            
            <div className="sm-content" style={{ padding: "10px", background: "#fdfbff", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
                {loading && page === 1 ? (
                    <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>Loading directory...</p>
                ) : error ? (
                    <p style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</p>
                ) : universities.length > 0 ? (
                    <div>
                        {universities.map(uni => (
                            <SMDirectoryNode key={uni._id} type="university" data={uni} />
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
                                    {loading ? "Loading..." : "Load More Universities"}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>No study materials found.</p>
                )
                }
            </div>
        </section>
    );
}
