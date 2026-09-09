"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiFileText, FiArrowUpRight, FiInbox, FiStar, FiX } from "react-icons/fi";
import "./styles/QPSearch.css";

const highlightText = (text, keyword) => {
    if (!keyword || !text) return text;
    const words = String(keyword).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return text;

    const pattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = String(text).split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="qp-highlight">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

function QPSearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const urlQuery = searchParams.get("q") || "";
    const [query, setQuery] = useState(urlQuery);
    const [activeQuery, setActiveQuery] = useState(urlQuery);
    const [subjects, setSubjects] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [hasInitialFetched, setHasInitialFetched] = useState(false);

    // Initial fetch and sync when URL q parameter is present
    useEffect(() => {
        const currentUrlQ = searchParams.get("q") || "";
        setQuery(currentUrlQ);
        setActiveQuery(currentUrlQ);
        fetchSubjects(1, currentUrlQ, true);
    }, [searchParams]);

    const updateUrlQuery = (newQuery) => {
        const trimmed = newQuery.trim();
        const params = new URLSearchParams(window.location.search);
        if (trimmed) {
            params.set("q", trimmed);
        } else {
            params.delete("q");
        }
        const newUrl = params.toString() ? `/qp?${params.toString()}` : "/qp";
        router.replace(newUrl, { scroll: false });
    };

    const fetchSubjects = async (pageNum, searchQuery, isNewSearch = false) => {
        setLoadingSubjects(true);
        try {
            const endpoint = searchQuery && searchQuery.trim()
                ? `/api/qp/v1/search/subjects?q=${encodeURIComponent(searchQuery.trim())}&page=${pageNum}&limit=20`
                : `/api/qp/v1/subjects?page=${pageNum}&limit=20`;

            const res = await fetch(endpoint);
            const json = await res.json();

            if (json.success) {
                if (isNewSearch || pageNum === 1) {
                    setSubjects(json.data);
                } else {
                    setSubjects((prev) => [...prev, ...json.data]);
                }
                setTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error("Error fetching subjects:", err);
        }
        setLoadingSubjects(false);
        setHasInitialFetched(true);
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setPage(1);
        setActiveQuery(query);
        updateUrlQuery(query);
        fetchSubjects(1, query, true);
    };

    const handleClearQuery = () => {
        setQuery("");
        setActiveQuery("");
        setPage(1);
        updateUrlQuery("");
        fetchSubjects(1, "", true);
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSubjects(nextPage, activeQuery, false);
        }
    };

    return (
        <section className="qp-search-wrap">
            <div className="qp-search-card">
                <header className="qp-search-head">
                    <div className="qp-search-badge">
                        <FiStar className="qp-badge-icon" aria-hidden="true" />
                        <span>Search Previous Year Question Papers by Subject Name</span>
                    </div>
                    <h2 className="qp-search-title">Search Subjects</h2>
                    <p className="qp-search-subtitle">
                        Instantly find and download past exam papers for any subject.
                    </p>
                </header>

                <form onSubmit={handleSearchSubmit} className="qp-search-form">
                    <div className="qp-search-bar">
                        <FiSearch className="qp-search-bar__icon" aria-hidden="true" />
                        <input
                            type="text"
                            className="qp-search-bar__input"
                            placeholder="Search by subject name (e.g., Cloud Computing, Data Structures...)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search subjects"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={handleClearQuery}
                                className="qp-search-clear-btn"
                                aria-label="Clear search"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="qp-search-submit-btn"
                        aria-label="Submit search"
                        disabled={loadingSubjects}
                    >
                        <FiSearch className="qp-submit-btn-icon" aria-hidden="true" />
                        <span className="qp-submit-btn-text">Search</span>
                    </button>
                </form>
            </div>

            <div className="qp-results" aria-live="polite">
                {!hasInitialFetched && loadingSubjects ? (
                    <div className="qp-state qp-state--loading">
                        <span className="qp-spinner" aria-hidden="true" />
                        <p>Loading subjects...</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="qp-state qp-state--empty">
                        <FiInbox className="qp-state__icon" aria-hidden="true" />
                        <p>
                            {activeQuery
                                ? `No subjects found matching "${activeQuery}". Try a different keyword.`
                                : "No subjects available."}
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="qp-results-list" key={activeQuery}>
                            {subjects.map((sub) => (
                                <li className="qp-result-item" key={sub._id}>
                                    <a
                                        href={`/qp/${sub._id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="qp-result-link"
                                    >
                                        <span className="qp-result-tab" aria-hidden="true" />
                                        <FiFileText className="qp-result-icon" aria-hidden="true" />
                                        <span className="qp-result-name">
                                            {highlightText(sub.name, activeQuery)}
                                        </span>
                                        <FiArrowUpRight className="qp-result-arrow" aria-hidden="true" />
                                    </a>
                                </li>
                            ))}
                        </ul>

                        {page < totalPages && (
                            <div className="qp-loadmore">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingSubjects}
                                    className="qp-loadmore__btn"
                                >
                                    {loadingSubjects ? "Loading more..." : "View more subjects"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

export default function QPSearch() {
    return (
        <Suspense
            fallback={
                <section className="qp-search-wrap">
                    <div className="qp-state qp-state--loading">
                        <span className="qp-spinner" aria-hidden="true" />
                        <p>Loading subject search...</p>
                    </div>
                </section>
            }
        >
            <QPSearchContent />
        </Suspense>
    );
}