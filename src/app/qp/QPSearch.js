"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiFileText, FiArrowUpRight, FiInbox, FiStar } from "react-icons/fi";
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
                    setSubjects((prev) => [...prev, ...json.data]);
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
        <section className="qp-search-wrap">
            <header className="qp-search-head">
                <div className="qp-search-badge">
                    <FiStar className="qp-badge-icon" aria-hidden="true" />
                    <span>Instant Subject Finder</span>
                </div>
                <h2 className="qp-search-title">Search Subjects</h2>
                <p className="qp-search-subtitle">
                    Instantly find and download question papers for any subject.
                </p>
            </header>

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
            </div>

            <div className="qp-results" aria-live="polite">
                {!hasInitialFetched && loadingSubjects ? (
                    <div className="qp-state qp-state--loading">
                        <span className="qp-spinner" aria-hidden="true" />
                        <p>Loading latest subjects...</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="qp-state qp-state--empty">
                        <FiInbox className="qp-state__icon" aria-hidden="true" />
                        <p>
                            No subjects found matching &ldquo;{query}&rdquo;. Try a different keyword.
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="qp-results-list" key={query}>
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
                                            {highlightText(sub.name, query)}
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