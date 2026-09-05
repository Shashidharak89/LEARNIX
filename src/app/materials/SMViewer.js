"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiFileText, FiSearch, FiX, FiCheck, FiFilter } from "react-icons/fi";
import SMDirectoryNode from "@/app/admin/study-materials/SMDirectoryNode";
import SMAdminSearchResults from "@/app/admin/study-materials/SMAdminSearchResults";
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
            <div style={{ 
                marginBottom: "20px", 
                background: "#fff",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid #e9d5ff",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.05)"
            }}>
                <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ 
                        position: "relative", 
                        flex: 1, 
                        minWidth: "260px",
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
                            placeholder="Search study materials (e.g. Physics, Mathematics...)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
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
                    
                    <button
                        type="submit"
                        style={{
                            background: "#7c3aed",
                            color: "#ffffff",
                            border: "none",
                            padding: "0 22px",
                            height: "42px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "0.2s",
                            boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#6d28d9"}
                        onMouseOut={(e) => e.currentTarget.style.background = "#7c3aed"}
                    >
                        <FiSearch size={16} />
                        Search
                    </button>

                    {(searchInput || activeQuery) && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                padding: "0 18px",
                                height: "42px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "#fca5a5"}
                            onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
                        >
                            <FiX size={16} />
                            Clear
                        </button>
                    )}
                </form>

                {/* Category Scope Selection Pills */}
                <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>
                        <FiFilter size={14} color="#7c3aed" />
                        <span>Search Scope:</span>
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
                                    {isSelected && <FiCheck size={12} />}
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="sm-content" style={{ padding: "16px", background: "#fdfbff", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
                {activeQuery.trim() ? (
                    <SMAdminSearchResults 
                        searchQuery={activeQuery}
                        selectedCategories={selectedCategories}
                        onClearSearch={handleClearSearch} 
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
