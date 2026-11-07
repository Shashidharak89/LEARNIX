"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  FiAlertTriangle,
  FiFilter,
  FiCheck,
} from "react-icons/fi";
import LearnixCodeNav from "../components/LearnixCodeNav";
import ProblemStatusBadge from "../components/ProblemStatusBadge";
import "./ProblemsList.css";

const THEME_KEY = "learnix-code-theme";

function ProblemsListContent() {
  const searchParams = useSearchParams();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  // Topics list from backend
  const [topics, setTopics] = useState([]);
  // Multi-select topics array
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Topic filter modal state
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [tempSelectedTopics, setTempSelectedTopics] = useState([]);
  const [modalTopicSearch, setModalTopicSearch] = useState("");

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

  // Fetch available topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await fetch("/api/coding/topics");
        const data = await res.json();
        if (data.success && Array.isArray(data.topics)) {
          setTopics(data.topics);
        }
      } catch (err) {
        console.error("Failed to load topics:", err);
      }
    }
    loadTopics();
  }, []);

  // Sync with URL query parameters on mount or change
  useEffect(() => {
    const qParam = searchParams.get("search") || searchParams.get("q") || "";
    const topicParam = searchParams.get("topics") || searchParams.get("topic") || "";
    const diffParam = searchParams.get("difficulty") || "all";

    if (qParam) {
      setSearchInput(qParam);
      setActiveSearch(qParam);
    }
    if (topicParam) {
      const parsed = topicParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      setSelectedTopics(parsed);
    }
    if (diffParam && diffParam !== "all") {
      setDifficultyFilter(diffParam);
    }
  }, [searchParams]);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (showTopicModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowTopicModal(false);
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [showTopicModal]);

  const wrapperClass = `lcp-wrapper lcp-theme-${theme}`;

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  const fetchProblems = useCallback(
    async (opts = {}) => {
      const {
        pageToFetch = 1,
        search = activeSearch,
        topicsToQuery = selectedTopics,
        difficulty = difficultyFilter,
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
          search: (search || "").trim(),
          topics: (topicsToQuery || []).join(","),
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
    },
    [activeSearch, selectedTopics, difficultyFilter]
  );

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
    const qParam = searchParams.get("search") || searchParams.get("q") || "";
    const topicParam = searchParams.get("topics") || searchParams.get("topic") || "";
    const diffParam = searchParams.get("difficulty") || "all";
    const initialTopics = topicParam
      ? topicParam
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    fetchProblems({
      pageToFetch: 1,
      search: qParam,
      topicsToQuery: initialTopics,
      difficulty: diffParam,
      append: false,
    });
    fetchUserStatus();
  }, [searchParams, fetchUserStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    setActiveSearch(q);
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: q,
      topicsToQuery: selectedTopics,
      difficulty: difficultyFilter,
      append: false,
    });
  }

  function handleClearSearch() {
    setSearchInput("");
    if (activeSearch) {
      setActiveSearch("");
      setPage(1);
      fetchProblems({
        pageToFetch: 1,
        search: "",
        topicsToQuery: selectedTopics,
        difficulty: difficultyFilter,
        append: false,
      });
    }
  }

  function handleDifficultyChange(diff) {
    setDifficultyFilter(diff);
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: activeSearch,
      topicsToQuery: selectedTopics,
      difficulty: diff,
      append: false,
    });
  }

  // Tag click on problem row -> toggles that topic in selectedTopics
  function handleTagClick(tag) {
    const norm = tag.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const exists = selectedTopics.some(
      (t) => t.toLowerCase() === norm || t.toLowerCase() === tag.toLowerCase()
    );
    const nextTopics = exists
      ? selectedTopics.filter(
          (t) => t.toLowerCase() !== norm && t.toLowerCase() !== tag.toLowerCase()
        )
      : [...selectedTopics, tag];

    setSelectedTopics(nextTopics);
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: activeSearch,
      topicsToQuery: nextTopics,
      difficulty: difficultyFilter,
      append: false,
    });
  }

  // Remove single topic badge
  function handleRemoveSingleTopic(topicSlug) {
    const next = selectedTopics.filter(
      (t) =>
        t.toLowerCase() !== topicSlug.toLowerCase() &&
        t.toLowerCase().replace(/[^a-z0-9]/g, "-") !== topicSlug.toLowerCase()
    );
    setSelectedTopics(next);
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: activeSearch,
      topicsToQuery: next,
      difficulty: difficultyFilter,
      append: false,
    });
  }

  // Clear all topics
  function handleClearAllTopics() {
    setSelectedTopics([]);
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: activeSearch,
      topicsToQuery: [],
      difficulty: difficultyFilter,
      append: false,
    });
  }

  // Modal controls
  function openTopicModal() {
    setTempSelectedTopics([...selectedTopics]);
    setModalTopicSearch("");
    setShowTopicModal(true);
  }

  function closeTopicModal() {
    setShowTopicModal(false);
  }

  function handleToggleModalTopic(topicIdentifier) {
    const norm = topicIdentifier.toLowerCase();
    setTempSelectedTopics((prev) => {
      const exists = prev.some(
        (t) =>
          t.toLowerCase() === norm ||
          t.toLowerCase().replace(/[^a-z0-9]/g, "-") === norm
      );
      if (exists) {
        return prev.filter(
          (t) =>
            t.toLowerCase() !== norm &&
            t.toLowerCase().replace(/[^a-z0-9]/g, "-") !== norm
        );
      } else {
        return [...prev, topicIdentifier];
      }
    });
  }

  function handleSelectAllModalTopics() {
    const all = topics.map((t) => t.topicId || t.name);
    setTempSelectedTopics(all);
  }

  function handleDeselectAllModalTopics() {
    setTempSelectedTopics([]);
  }

  function handleApplyModalFilters() {
    setSelectedTopics(tempSelectedTopics);
    setShowTopicModal(false);
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: activeSearch,
      topicsToQuery: tempSelectedTopics,
      difficulty: difficultyFilter,
      append: false,
    });
  }

  function handleViewMore() {
    if (loadingMore || !hasMore) return;
    fetchProblems({
      pageToFetch: page + 1,
      search: activeSearch,
      topicsToQuery: selectedTopics,
      difficulty: difficultyFilter,
      append: true,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setActiveSearch("");
    setSelectedTopics([]);
    setDifficultyFilter("all");
    setPage(1);
    fetchProblems({
      pageToFetch: 1,
      search: "",
      topicsToQuery: [],
      difficulty: "all",
      append: false,
    });
  }

  // Topics filtered in the modal by the modal's search query
  const filteredModalTopics = topics.filter((t) => {
    if (!modalTopicSearch.trim()) return true;
    const q = modalTopicSearch.toLowerCase().trim();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.topicId && t.topicId.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

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
              <span className="lcp-total-pill">
                {total} {total === 1 ? "problem" : "problems"}
              </span>
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
                  title="Clear search"
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

          <div className="lcp-toolbar-actions">
            {/* Filter Icon Button to open Topics Popup */}
            <button
              type="button"
              onClick={openTopicModal}
              className={`lcp-filter-trigger-btn ${selectedTopics.length > 0 ? "active" : ""}`}
              title="Filter by topics"
            >
              <FiFilter size={16} />
              <span>Filter Topics</span>
              {selectedTopics.length > 0 && (
                <span className="lcp-filter-badge-count">{selectedTopics.length}</span>
              )}
            </button>

            {/* Difficulty Tabs */}
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
        </div>

        {/* Active Topics Bar (replaces horizontal scrollbar) */}
        {selectedTopics.length > 0 && (
          <div className="lcp-active-filters-bar">
            <div className="lcp-active-filters-left">
              <span className="lcp-active-filters-label">
                <FiTag size={13} />
                <span>Selected Topics ({selectedTopics.length}):</span>
              </span>
              <div className="lcp-active-tags-list">
                {selectedTopics.map((topSlug) => {
                  const matched = topics.find(
                    (t) =>
                      (t.topicId || "").toLowerCase() === topSlug.toLowerCase() ||
                      (t.name || "").toLowerCase() === topSlug.toLowerCase() ||
                      (t.name || "").toLowerCase().replace(/[^a-z0-9]/g, "-") ===
                        topSlug.toLowerCase()
                  );
                  const displayName = matched?.name || topSlug;
                  return (
                    <span key={topSlug} className="lcp-active-filter-tag">
                      <span>{displayName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleTopic(topSlug)}
                        className="lcp-remove-filter-btn"
                        title={`Remove ${displayName}`}
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="lcp-active-filters-actions">
              <button
                type="button"
                onClick={openTopicModal}
                className="lcp-modify-topics-btn"
              >
                + Edit Topics
              </button>
              <button
                type="button"
                onClick={handleClearAllTopics}
                className="lcp-clear-all-topics-btn"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="lcp-error-card">
            <FiAlertTriangle size={20} color="#f97316" />
            <span>{error}</span>
            <button
              onClick={() =>
                fetchProblems({
                  pageToFetch: page,
                  search: activeSearch,
                  topicsToQuery: selectedTopics,
                  difficulty: difficultyFilter,
                })
              }
              className="lcp-retry-btn"
            >
              Try Again
            </button>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          renderSkeletons()
        ) : problems.length === 0 ? (
          <div className="lcp-empty-card">
            <div className="lcp-empty-icon-wrap">
              <FiList size={36} />
            </div>
            <h3 className="lcp-empty-title">No Problems Found</h3>
            <p className="lcp-empty-desc">
              {activeSearch || selectedTopics.length > 0 || difficultyFilter !== "all"
                ? "No challenges match your selected filters. Try searching for something else or resetting your topic/difficulty selections."
                : "Problems will appear here once added."}
            </p>
            {(activeSearch || selectedTopics.length > 0 || difficultyFilter !== "all") && (
              <button className="lcp-retry-btn" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Card List */}
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
                          {(p.tags || p.topicIds || []).map((t, idx) => {
                            const isTopicSelected = selectedTopics.some(
                              (st) =>
                                st.toLowerCase() === t.toLowerCase() ||
                                st.toLowerCase().replace(/[^a-z0-9]/g, "-") ===
                                  t.toLowerCase().replace(/[^a-z0-9]/g, "-")
                            );
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleTagClick(t)}
                                className={`lcp-tag lcp-tag-clickable ${
                                  isTopicSelected ? "active" : ""
                                }`}
                                title={`Toggle topic filter: ${t}`}
                              >
                                <FiTag style={{ fontSize: "0.7rem", marginRight: "3px" }} />
                                {t}
                              </button>
                            );
                          })}
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

      {/* Multi-Select Topics Popup Modal */}
      {showTopicModal && (
        <div className="lcp-modal-overlay" onClick={closeTopicModal}>
          <div
            className="lcp-modal-window"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-modal-title"
          >
            {/* Modal Header */}
            <div className="lcp-modal-header">
              <div className="lcp-modal-title-group">
                <div className="lcp-modal-icon-wrap">
                  <FiFilter size={18} />
                </div>
                <div>
                  <h2 id="topic-modal-title" className="lcp-modal-title">
                    Filter by Topics
                  </h2>
                  <p className="lcp-modal-subtitle">
                    Select topics to show matching coding problems
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTopicModal}
                className="lcp-modal-close-btn"
                title="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="lcp-modal-search-box">
              <FiSearch size={15} className="lcp-modal-search-icon" />
              <input
                type="text"
                placeholder="Search topics (e.g. Array, Math, Dynamic Programming)..."
                value={modalTopicSearch}
                onChange={(e) => setModalTopicSearch(e.target.value)}
                className="lcp-modal-search-input"
                autoFocus
              />
              {modalTopicSearch && (
                <button
                  type="button"
                  onClick={() => setModalTopicSearch("")}
                  className="lcp-modal-search-clear"
                  title="Clear search"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

            {/* Quick action bar */}
            <div className="lcp-modal-actions-bar">
              <span className="lcp-modal-count-indicator">
                <strong>{tempSelectedTopics.length}</strong> of {topics.length} selected
              </span>
              <div className="lcp-modal-quick-btns">
                <button
                  type="button"
                  onClick={handleSelectAllModalTopics}
                  className="lcp-modal-quick-btn"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllModalTopics}
                  className="lcp-modal-quick-btn"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Modal Topics List - Row-wise */}
            <div className="lcp-modal-topics-list">
              {filteredModalTopics.length === 0 ? (
                <div className="lcp-modal-empty">
                  No topics found matching &quot;{modalTopicSearch}&quot;
                </div>
              ) : (
                filteredModalTopics.map((top) => {
                  const topIdentifier =
                    top.topicId || top.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
                  const isChecked = tempSelectedTopics.some(
                    (t) =>
                      t.toLowerCase() === topIdentifier.toLowerCase() ||
                      t.toLowerCase() === (top.topicId || "").toLowerCase() ||
                      t.toLowerCase() === (top.name || "").toLowerCase() ||
                      t.toLowerCase().replace(/[^a-z0-9]/g, "-") === topIdentifier.toLowerCase()
                  );

                  return (
                    <div
                      key={top.topicId || top.name}
                      onClick={() => handleToggleModalTopic(topIdentifier)}
                      className={`lcp-modal-topic-row ${isChecked ? "selected" : ""}`}
                    >
                      <div className="lcp-modal-row-left">
                        <div className={`lcp-modal-checkbox ${isChecked ? "checked" : ""}`}>
                          {isChecked && <FiCheck size={13} />}
                        </div>
                        <div className="lcp-modal-row-text">
                          <span className="lcp-modal-row-name">{top.name}</span>
                          {top.description && (
                            <span className="lcp-modal-row-desc">{top.description}</span>
                          )}
                        </div>
                      </div>

                      <div className="lcp-modal-row-right">
                        {top.problemsCount !== undefined && (
                          <span className="lcp-modal-count-badge">
                            {top.problemsCount} {top.problemsCount === 1 ? "problem" : "problems"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="lcp-modal-footer">
              <button
                type="button"
                onClick={closeTopicModal}
                className="lcp-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyModalFilters}
                className="lcp-modal-apply-btn"
              >
                <span>Apply Filters</span>
                {tempSelectedTopics.length > 0 && (
                  <span className="lcp-modal-apply-count">({tempSelectedTopics.length})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProblemsListPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FiLoader className="lcp-spinner" size={28} color="#f97316" />
        </div>
      }
    >
      <ProblemsListContent />
    </Suspense>
  );
}
