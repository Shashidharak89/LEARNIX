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
            {/* Search & Intro Card */}
            <div className="sm-search-card">
                <div className="sm-section-header">
                    <h1 id="sm-papers-section" className="sm-subtitle">
                        <FiFileText className="sm-section-icon" />
                        Browse Study Materials Directory
                    </h1>
                </div>
                
                <form onSubmit={handleSearchSubmit} className="sm-search-form">
                    <div className="sm-search-wrap">
                        <FiSearch className="sm-search-icon" />
                        <input
                            type="text"
                            placeholder="Search study materials (e.g. Physics, Mathematics...)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="sm-search-input"
                            aria-label="Search study materials"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                className="sm-search-clear-inline"
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                            >
                                <FiX size={14} />
                            </button>
                        )}
                    </div>
                    
                    <button
                        type="submit"
                        className="sm-search-btn"
                        disabled={!searchInput.trim()}
                        aria-label="Search study materials"
                    >
                        <FiSearch className="sm-search-btn-icon" />
                        <span className="sm-search-btn-text">Search</span>
                    </button>
                </form>

                {/* Category Scope Selection Pills */}
                <div className="sm-search-scope">
                    <div className="sm-search-scope-label">
                        <FiFilter size={14} color="#0b74ff" />
                        <span>Scope:</span>
                    </div>
                    <div className="sm-search-scope-pills">
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

            {/* Preference Card (independent card) */}
            <SMPreferenceCard />

            {/* Directory / Search Results Card (independent card) */}
            <div className="sm-content">
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
