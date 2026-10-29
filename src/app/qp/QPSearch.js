"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiFileText, FiArrowUpRight, FiInbox, FiX } from "react-icons/fi";
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
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasInitialFetched, setHasInitialFetched] = useState(false);

    const fetchSubjects = async (pageNum, searchQuery, isNewSearch = false, isLoadMore = false) => {
        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoadingSubjects(true);
        }
        try {
            const endpoint = searchQuery && searchQuery.trim()
                ? `/api/qp/v1/search/subjects?q=${encodeURIComponent(searchQuery.trim())}&page=${pageNum}&limit=10`
                : `/api/qp/v1/subjects?page=${pageNum}&limit=10`;

            const res = await fetch(endpoint);
            const json = await res.json();

            if (json.success) {
                if (isNewSearch || pageNum === 1) {
                    setSubjects(json.data || []);
                } else {
                    setSubjects((prev) => [...prev, ...(json.data || [])]);
                }
                setTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error("Error fetching subjects:", err);
        } finally {
            setLoadingSubjects(false);
            setLoadingMore(false);
            setHasInitialFetched(true);
        }
    };

    // Initial fetch and sync when URL q parameter is present
    useEffect(() => {
        const currentUrlQ = searchParams.get("q") || "";
        setQuery(currentUrlQ);
        setActiveQuery(currentUrlQ);
        fetchSubjects(1, currentUrlQ, true, false);
    }, [searchParams]);

    const updateUrlQuery = (newQuery) => {
        const trimmed = newQuery.trim();
        const params = new window.URLSearchParams(window.location.search);
        if (trimmed) {
            params.set("q", trimmed);
        } else {
            params.delete("q");
        }
        const newUrl = params.toString() ? `/qp?${params.toString()}` : "/qp";
        router.replace(newUrl, { scroll: false });
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setPage(1);
        setActiveQuery(query);
        updateUrlQuery(query);
        fetchSubjects(1, query, true, false);
    };

    const handleClearQuery = () => {
        setQuery("");
        setActiveQuery("");
        setPage(1);
        updateUrlQuery("");
        fetchSubjects(1, "", true, false);
    };

    const handleLoadMore = () => {
        if (page < totalPages && !loadingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSubjects(nextPage, activeQuery, false, true);
        }
    };

    return (
        <section className="qp-search-wrap">
            <div className="qp-search-card">
                <header className="qp-search-head">
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
                        disabled={loadingSubjects || loadingMore}
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
                                        <div className="qp-result-icon-wrap" aria-hidden="true">
                                            <FiFileText className="qp-result-icon" />
                                        </div>
                                        <span className="qp-result-name">
                                            {highlightText(sub.name, activeQuery)}
                                        </span>
                                        <div className="qp-result-arrow-wrap" aria-hidden="true">
                                            <FiArrowUpRight className="qp-result-arrow" />
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>

                        {page < totalPages && (
                            <div className="qp-loadmore">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className={`qp-loadmore__btn ${loadingMore ? "is-loading" : ""}`}
                                    aria-label={loadingMore ? "Loading more subjects" : "View more subjects"}
                                >
                                    {loadingMore ? (
                                        <span className="qp-dots-loader" aria-hidden="true">
                                            <span className="qp-dot" />
                                            <span className="qp-dot" />
                                            <span className="qp-dot" />
                                        </span>
                                    ) : (
                                        <span>View more subjects</span>
                                    )}
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