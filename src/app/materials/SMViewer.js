"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiFileText, FiSearch, FiX, FiCheck, FiFilter } from "react-icons/fi";
import SMDirectoryNode from "@/app/admin/study-materials/SMDirectoryNode";
import SMAdminSearchResults from "@/app/admin/study-materials/SMAdminSearchResults";
import SMPreferenceCard from "./SMPreferenceCard";
import "./SMViewer.css";

const CATEGORY_OPTIONS = [
    { id: "subjects", label: "Subjects" },
    { id: "universities", label: "Universities" },
    { id: "colleges", label: "Colleges" },
    { id: "courses", label: "Courses" },
    { id: "semesters", label: "Semesters" },
    { id: "batches", label: "Batches" },
];

export default function SMViewer() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Search input state (typing will not trigger search)
    const [searchInput, setSearchInput] = useState("");
    // Active query state (committed query that triggers search)
    const [activeQuery, setActiveQuery] = useState("");
    // Selected search category scope (subjects only by default)
    const [selectedCategories, setSelectedCategories] = useState(["subjects"]);

    // Initialize search from URL query parameter on mount / URL change
    useEffect(() => {
        const queryFromUrl = searchParams.get("q") || searchParams.get("search") || "";
        if (queryFromUrl) {
            setSearchInput(queryFromUrl);
            setActiveQuery(queryFromUrl);
        }
    }, [searchParams]);

    const updateUrlQueryParam = (query) => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set("q", query);
        } else {
            params.delete("q");
        }
        const queryString = params.toString();
        const updatedUrl = queryString ? `${pathname}?${queryString}` : pathname;
        router.push(updatedUrl, { scroll: false });
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchInput.trim();
        setActiveQuery(trimmed);
        setPage(1);
        updateUrlQueryParam(trimmed);
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setActiveQuery("");
        setPage(1);
        updateUrlQueryParam("");
    };

    const toggleCategory = (catId) => {
        setSelectedCategories(prev => {
            let updated;
            if (prev.includes(catId)) {
                // Keep at least one category selected or fallback to subjects
                if (prev.length === 1) return prev;
                updated = prev.filter(id => id !== catId);
            } else {
                updated = [...prev, catId];
            }
            return updated;
        });
    };

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

    // Refetch directory when no search is active
    useEffect(() => {
        if (!activeQuery.trim()) {
            fetchData(1, "", false);
        }
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
            
            {/* Search Box & Category Filters */}
            <div className="sm-search-container" style={{ 
                marginBottom: "16px", 
                background: "#ffffff",
                padding: "18px 20px",
                borderRadius: "18px",
                border: "1px solid #e0f2fe",
                boxShadow: "0 4px 16px rgba(14, 165, 233, 0.06)"
            }}>
                <form onSubmit={handleSearchSubmit} className="sm-search-form" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ 
                        position: "relative", 
                        flex: 1, 
                        minWidth: "260px",
                        display: "flex", 
                        alignItems: "center" 
                    }}>
                        <FiSearch style={{ 
                            position: "absolute", 
                            left: "16px", 
                            color: "#0ea5e9", 
                            fontSize: "19px" 
                        }} />
                        <input
                            type="text"
                            placeholder="Search study materials (e.g. Physics, Mathematics...)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 16px 12px 46px",
                                borderRadius: "12px",
                                border: "1.5px solid #7dd3fc",
                                outline: "none",
                                fontSize: "15px",
                                background: "#f8fafc",
                                color: "#1e293b",
                                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#0ea5e9";
                                e.target.style.background = "#ffffff";
                                e.target.style.boxShadow = "0 0 0 4px rgba(14, 165, 233, 0.12)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#7dd3fc";
                                e.target.style.background = "#f8fafc";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        style={{
                            background: "#0ea5e9",
                            color: "#ffffff",
                            border: "none",
                            padding: "0 22px",
                            height: "46px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px rgba(14, 165, 233, 0.25)"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "#0284c7";
                            e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "#0ea5e9";
                            e.currentTarget.style.transform = "none";
                        }}
                    >
                        <FiSearch size={17} />
                        <span className="sm-search-btn-text">Search</span>
                    </button>

                    {(searchInput || activeQuery) && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            style={{
                                background: "#fef2f2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                padding: "0 18px",
                                height: "46px",
                                borderRadius: "12px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "#fecaca"}
                            onMouseOut={(e) => e.currentTarget.style.background = "#fef2f2"}
                        >
                            <FiX size={17} />
                            <span className="sm-search-btn-text">Clear</span>
                        </button>
                    )}
                </form>

                {/* Category Scope Selection Pills */}
                <div className="sm-search-scope" style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", fontWeight: "600", whiteSpace: "nowrap" }}>
                        <FiFilter size={14} color="#0ea5e9" />
                        <span>Scope:</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {CATEGORY_OPTIONS.map(cat => {
                            const isSelected = selectedCategories.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`sm-category-pill ${isSelected ? "active" : ""}`}
                                >
                                    {isSelected && <FiCheck size={13} />}
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Your Preference Card */}
            <SMPreferenceCard />

            <div className="sm-content" style={{ padding: "20px", background: "#fafcfe", borderRadius: "18px", border: "1px solid #e0f2fe", boxShadow: "0 2px 10px rgba(14, 165, 233, 0.03)" }}>
                {activeQuery.trim() ? (
                    <SMAdminSearchResults 
                        searchQuery={activeQuery}
                        selectedCategories={selectedCategories}
                        onClearSearch={handleClearSearch} 
                    />
                ) : loading && page === 1 ? (
                    <p style={{ textAlign: "center", color: "#64748b", padding: "24px", fontSize: "15px" }}>Loading directory...</p>
                ) : error ? (
                    <p style={{ color: "#ef4444", textAlign: "center", padding: "24px", fontSize: "15px" }}>{error}</p>
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
                            <div style={{ textAlign: "center", marginTop: "24px" }}>
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    style={{
                                        background: loading ? "#f0f9ff" : "#ffffff",
                                        color: loading ? "#94a3b8" : "#0ea5e9",
                                        border: "1.5px solid #0ea5e9",
                                        padding: "12px 28px",
                                        borderRadius: "12px",
                                        cursor: loading ? "default" : "pointer",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        boxShadow: "0 2px 8px rgba(14, 165, 233, 0.1)",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    {loading ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ textAlign: "center", color: "#64748b", padding: "24px", fontSize: "15px" }}>No study materials found matching "{activeQuery}".</p>
                )}
            </div>
        </section>
    );
}
