"use client";

import { useEffect, useState } from "react";
import SMDirectoryNode from "./SMDirectoryNode";

const CATEGORIES = [
    { id: "subjects", label: "Subjects", endpoint: "/api/sm/v1/search/subjects", type: "subject" },
    { id: "universities", label: "Universities", endpoint: "/api/sm/v1/search/universities", type: "university" },
    { id: "colleges", label: "Colleges", endpoint: "/api/sm/v1/search/colleges", type: "college" },
    { id: "courses", label: "Courses", endpoint: "/api/sm/v1/search/courses", type: "course" },
    { id: "semesters", label: "Semesters", endpoint: "/api/sm/v1/search/semesters", type: "semester" },
    { id: "batches", label: "Batches", endpoint: "/api/sm/v1/search/batches", type: "batch" },
];

const emptyCategory = () => ({ data: [], page: 1, totalPages: 1, loading: false, total: 0 });
const initialState = () => Object.fromEntries(CATEGORIES.map(({ id }) => [id, emptyCategory()]));

function idOf(value) {
    if (!value) return "";
    return typeof value === "object" ? value._id || "" : value;
}

function getParentParams(type, item) {
    const params = {};
    if (type !== "university") params.universityId = idOf(item.university);
    if (["course", "semester", "batch", "subject"].includes(type)) params.collegeId = idOf(item.college);
    if (["semester", "batch", "subject"].includes(type)) params.courseId = idOf(item.course);
    if (["batch", "subject"].includes(type)) params.semesterId = idOf(item.sem);
    if (type === "subject") params.batchId = idOf(item.batch);
    return params;
}

export default function SMAdminSearchResults({ searchQuery, selectedCategories = ["subjects"], onClearSearch }) {
    const activeCategories = selectedCategories.length
        ? CATEGORIES.filter(({ id }) => selectedCategories.includes(id))
        : CATEGORIES.filter(({ id }) => id === "subjects");
    const [state, setState] = useState(initialState);

    const fetchCategory = async (catId, page, append = false) => {
        const category = CATEGORIES.find(({ id }) => id === catId);
        if (!category) return;

        setState((current) => ({
            ...current,
            [catId]: { ...current[catId], loading: true },
        }));

        try {
            const response = await fetch(
                `${category.endpoint}?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`,
                { cache: "no-store" },
            );
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Search failed");

            setState((current) => {
                const currentItems = append ? current[catId].data : [];
                const data = Array.from(new Map([...currentItems, ...result.data].map((item) => [item._id, item])).values());
                return {
                    ...current,
                    [catId]: {
                        data,
                        page,
                        totalPages: result.pagination?.totalPages || 1,
                        total: result.pagination?.total || data.length,
                        loading: false,
                    },
                };
            });
        } catch (error) {
            console.error(`Error searching study materials (${catId}):`, error);
            setState((current) => ({ ...current, [catId]: { ...current[catId], loading: false } }));
        }
    };

    useEffect(() => {
        setState(initialState());
        if (searchQuery.trim()) activeCategories.forEach(({ id }) => fetchCategory(id, 1));
        // fetchCategory reads current query and categories for this search request.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, JSON.stringify(selectedCategories)]);

    const loadMore = (categoryId) => {
        const category = state[categoryId];
        if (category.page < category.totalPages && !category.loading) {
            fetchCategory(categoryId, category.page + 1, true);
        }
    };

    const loading = activeCategories.some(({ id }) => state[id].loading && state[id].page === 1);
    const hasResults = activeCategories.some(({ id }) => state[id].data.length > 0);

    if (loading) {
        return (
            <div className="sm-dir-skeleton-list" aria-label="Searching study materials">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="sm-dir-skeleton-card">
                        <div className="sm-dir-skeleton-icon" />
                        <div className="sm-dir-skeleton-text-wrap"><div className="sm-dir-skeleton-line" /></div>
                        <div className="sm-dir-skeleton-chevron" />
                    </div>
                ))}
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div className="sm-search-empty" role="status">
                <p>No study materials found for “{searchQuery}”.</p>
                <button type="button" onClick={onClearSearch}>Clear search</button>
            </div>
        );
    }

    return (
        <div className="sm-search-directory-results">
            {activeCategories.map((category) => {
                const result = state[category.id];
                if (!result.data.length) return null;

                return (
                    <section className="sm-search-result-group" key={category.id} aria-label={`${category.label} search results`}>
                        <h2 className="sm-search-result-heading">
                            {category.label}
                            <span>{result.total} {result.total === 1 ? "match" : "matches"}</span>
                        </h2>
                        <div>
                            {result.data.map((item) => (
                                <SMDirectoryNode
                                    key={item._id}
                                    type={category.type}
                                    data={item}
                                    parentParams={getParentParams(category.type, item)}
                                    highlightKeyword={searchQuery}
                                />
                            ))}
                        </div>
                        {result.page < result.totalPages && (
                            <button
                                className="sm-search-load-more"
                                type="button"
                                disabled={result.loading}
                                onClick={() => loadMore(category.id)}
                            >
                                {result.loading ? "Loading…" : `Load more ${category.label.toLowerCase()}`}
                            </button>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
