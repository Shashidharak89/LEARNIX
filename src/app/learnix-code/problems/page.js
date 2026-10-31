"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiX,
  FiChevronDown,
  FiLoader,
  FiTag,
  FiArrowRight,
  FiSun,
  FiMoon,
  FiList,
} from "react-icons/fi";
import LearnixCodeNav from "../components/LearnixCodeNav";
import ProblemStatusBadge from "../components/ProblemStatusBadge";
import "./ProblemsList.css";

const THEME_KEY = "learnix-code-theme";

export default function ProblemsListPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  // Search state — input vs committed query
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Theme: "dark" | "light"  — default dark
  const [theme, setTheme] = useState("dark");

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      setTheme("dark");
    }
  }, []);

  // Apply theme class to wrapper
  const wrapperClass = `lcp-wrapper lcp-theme-${theme}`;

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  const fetchProblems = useCallback(async (opts = {}) => {
    const {
      pageToFetch = 1,
      search = "",
      difficulty = "all",
      append = false,
    } = opts;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageToFetch),
        size: "20",
        search: search.trim(),
        difficulty,
      });
      const res = await fetch(`/api/coding/problems?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const incoming = data.problems || [];
        if (append) {
          setProblems((prev) => {
            const existing = new Set(prev.map((p) => p.problemId));
            return [...prev, ...incoming.filter((p) => !existing.has(p.problemId))];
          });
        } else {
          setProblems(incoming);
        }
        setPage(data.page || pageToFetch);
        setHasMore(Boolean(data.hasMore));
        setTotal(data.total || 0);
      } else {
        setError(data.error || "Failed to load problems");
      }
    } catch (err) {
      console.error("Failed to load problems:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchUserStatus = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    if (!token) {
      setStatusMap({});
      return;
    }
    try {
      const res = await fetch("/api/coding/user-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.statusMap) {
        setStatusMap(data.statusMap);
      }
    } catch (err) {
      console.error("Failed to fetch user problem status:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProblems({ pageToFetch: 1, search: "", difficulty: "all" });
    fetchUserStatus();
  }, [fetchProblems, fetchUserStatus]);

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    setActiveSearch(q);
    setPage(1);
    fetchProblems({ pageToFetch: 1, search: q, difficulty: difficultyFilter, append: false });
  }

  function handleClearSearch() {
    setSearchInput("");
    if (activeSearch) {
      setActiveSearch("");
      setPage(1);
      fetchProblems({ pageToFetch: 1, search: "", difficulty: difficultyFilter, append: false });
    }
  }

  function handleDifficultyChange(diff) {
    setDifficultyFilter(diff);
    setPage(1);
    fetchProblems({ pageToFetch: 1, search: activeSearch, difficulty: diff, append: false });
  }

  function handleViewMore() {
    if (loadingMore || !hasMore) return;
    fetchProblems({
      pageToFetch: page + 1,
      search: activeSearch,
      difficulty: difficultyFilter,
      append: true,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setActiveSearch("");
    setDifficultyFilter("all");
    setPage(1);
    fetchProblems({ pageToFetch: 1, search: "", difficulty: "all", append: false });
  }

  // Skeleton rows
  function renderSkeletons() {
    return (
      <div className="lcp-skeleton-list">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="lcp-skeleton-row">
            <div className="lcp-skeleton-id lcp-shimmer" />
            <div className="lcp-skeleton-body">
              <div className="lcp-skeleton-title lcp-shimmer" />
              <div className="lcp-skeleton-pills">
                <div className="lcp-skeleton-pill lcp-shimmer" style={{ width: "60px" }} />
                <div className="lcp-skeleton-pill lcp-shimmer" style={{ width: "80px" }} />
              </div>
            </div>
            <div className="lcp-skeleton-diff lcp-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <LearnixCodeNav theme={theme} onToggleTheme={toggleTheme} />

      <main className="lcp-main">
        {/* Page Header */}
        <div className="lcp-page-header">
          <div className="lcp-page-header-left">
            <h1 className="lcp-page-title">Problems</h1>
            {total > 0 && (
              <span className="lcp-total-pill">{total} {total === 1 ? "problem" : "problems"}</span>
            )}
          </div>
          <button
            className="lcp-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <FiSun size={17} /> : <FiMoon size={17} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="lcp-toolbar">
          <form className="lcp-search-form" onSubmit={handleSearchSubmit}>
            <div className="lcp-search-box">
              <FiSearch className="lcp-search-icon" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, tag, or #number..."
                className="lcp-search-input"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="lcp-search-clear"
                  title="Clear"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="lcp-search-submit">
              <FiSearch size={15} />
              <span>Search</span>
            </button>
          </form>

          <div className="lcp-diff-tabs">
            {["all", "Easy", "Medium", "Hard"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDifficultyChange(d)}
                className={`lcp-diff-tab ${difficultyFilter === d ? "active" : ""}`}
              >
                {d === "all" ? "All" : d}
              </button>
            ))}
          </div>
        </div>

        {/* Active search indicator */}
        {activeSearch && !loading && (
          <div className="lcp-search-indicator">
            <span>
              Showing results for: <strong>&ldquo;{activeSearch}&rdquo;</strong>
              {" — "}{total} {total === 1 ? "match" : "matches"} found
            </span>
            <button className="lcp-clear-filters-btn" onClick={handleClearFilters}>
              <FiX size={13} /> Clear
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          renderSkeletons()
        ) : error ? (
          <div className="lcp-error-state">
            <p>⚠️ {error}</p>
            <button onClick={() => fetchProblems({ pageToFetch: 1, search: activeSearch, difficulty: difficultyFilter })} className="lcp-retry-btn">
              Retry
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="lcp-empty-state">
            <FiList size={40} />
            <h3>{activeSearch || difficultyFilter !== "all" ? "No Matching Problems" : "No Problems Yet"}</h3>
            <p>
              {activeSearch || difficultyFilter !== "all"
                ? "Try a different search or clear your filters."
                : "Problems will appear here once added."}
            </p>
            {(activeSearch || difficultyFilter !== "all") && (
              <button className="lcp-retry-btn" onClick={handleClearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Admin-style Card List */}
            <div className="lcp-list-rows">
              {problems.map((p, index) => {
                const pid = p.order || index + 1;
                const diffClass =
                  p.difficulty === "Easy"
                    ? "lcp-badge-easy"
                    : p.difficulty === "Medium"
                    ? "lcp-badge-medium"
                    : "lcp-badge-hard";
                const pStatus =
                  statusMap[p.problemId] ||
                  (p.order !== undefined ? statusMap[String(p.order)] : null) ||
                  statusMap[String(pid)];

                return (
                  <div key={p.problemId || index} className="lcp-row-card">
                    <div className="lcp-row-left">
                      <div className="lcp-row-order" title={`Problem #${pid}`}>
                        #{pid}
                      </div>

                      <div className="lcp-row-content">
                        <div className="lcp-row-title-row">
                          <Link
                            href={`/learnix-code/problems/${pid}`}
                            className="lcp-row-title-link"
                            title={`Solve "${p.title}" in Learnix Code`}
                          >
                            <h3 className="lcp-row-title">{p.title}</h3>
                          </Link>
                          {pStatus && (
                            <ProblemStatusBadge
                              status={pStatus}
                              showText={true}
                              compact={true}
                              size={14}
                            />
                          )}
                          <span className={`lcp-badge ${diffClass}`}>
                            {p.difficulty}
                          </span>
                        </div>

                        <div className="lcp-row-topics-row">
                          {(p.tags || p.topicIds || []).map((t, idx) => (
                            <span key={idx} className="lcp-tag">
                              <FiTag style={{ fontSize: "0.7rem", marginRight: "3px" }} />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lcp-row-actions">
                      <Link
                        href={`/learnix-code/problems/${pid}`}
                        className="lcp-solve-btn"
                        title={`Solve "${p.title}"`}
                      >
                        <span>Solve</span>
                        <FiArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View More */}
            {hasMore && (
              <div className="lcp-view-more-wrap">
                <button
                  type="button"
                  onClick={handleViewMore}
                  disabled={loadingMore}
                  className="lcp-view-more-btn"
                >
                  {loadingMore ? (
                    <>
                      <FiLoader className="lcp-spinner" size={16} />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <span>View More Problems</span>
                      <FiChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && problems.length > 0 && !loadingMore && (
              <div className="lcp-end-indicator">
                All {total} problem{total !== 1 ? "s" : ""} loaded
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
