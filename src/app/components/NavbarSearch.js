"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiX,
  FiBell,
  FiFolder,
  FiBookOpen,
  FiFileText,
  FiChevronRight,
  FiEye,
  FiDownload,
  FiZap,
} from "react-icons/fi";
import "./styles/NavbarSearch.css";

const CATEGORIES = [
  { key: "works", label: "Resources", icon: FiFolder, href: "/works" },
  { key: "updates", label: "Updates", icon: FiBell, href: "/updates" },
  { key: "materials", label: "Study Materials", icon: FiBookOpen, href: "/materials" },
  { key: "questionPapers", label: "Question Papers", icon: FiFileText, href: "/qp" },
];

function normalizeResourceType(type, sourceFile) {
  const t = (type || "").toLowerCase().trim();
  const s = (sourceFile || "").toLowerCase().trim();

  // Only topic is mapped to resource (or source_file resources)
  if (
    t === "topic" ||
    t === "topics" ||
    t === "work" ||
    t === "works" ||
    t === "resource" ||
    t === "resources" ||
    s === "resources"
  ) {
    return "resource";
  }

  // Updates remain update
  if (t === "update" || t === "updates" || s === "updates") {
    return "update";
  }

  // Study materials remain study_material
  if (t === "study_material" || t === "materials" || t === "material" || s === "study_materials") {
    return "study_material";
  }

  // Question papers remain question_paper
  if (t === "question_paper" || t === "qp" || t === "questionpapers") {
    return "question_paper";
  }

  return t || "resource";
}

const TYPE_CONFIG = {
  resource: {
    label: "Resource",
    pluralLabel: "Resources",
    icon: FiFolder,
    badgeClass: "lnx-ai-type-pill--resource",
  },
  update: {
    label: "Update",
    pluralLabel: "Updates",
    icon: FiBell,
    badgeClass: "lnx-ai-type-pill--update",
  },
  study_material: {
    label: "Study Material",
    pluralLabel: "Study Materials",
    icon: FiBookOpen,
    badgeClass: "lnx-ai-type-pill--study",
  },
  question_paper: {
    label: "Question Paper",
    pluralLabel: "Question Papers",
    icon: FiFileText,
    badgeClass: "lnx-ai-type-pill--qp",
  },
};

function getAiItemHref(item) {
  const normType = normalizeResourceType(item.resource_type, item.source_file);
  const cleanId = item.resource_id ? String(item.resource_id).replace(/^["']|["']$/g, "").trim() : "";

  // Topic / Resource navigation -> /works/[id]
  if (normType === "resource") {
    if (cleanId) {
      if (cleanId.startsWith("sub-only-")) {
        return `/works/subject/${cleanId.replace("sub-only-", "")}`;
      }
      return `/works/${cleanId}`;
    }
    if (item.resource_url) return item.resource_url;
    return "/works";
  }

  // Update navigation -> /updates/[id]
  if (normType === "update") {
    if (cleanId) return `/updates/${cleanId}`;
    if (item.resource_url) return item.resource_url;
    return "/updates";
  }

  // Study material navigation -> direct resource_url or /materials query
  if (normType === "study_material") {
    if (item.resource_url) return item.resource_url;
    if (item.subject_name) return `/materials?q=${encodeURIComponent(item.subject_name)}`;
    return "/materials";
  }

  // Question paper navigation -> /qp/[id] or /qp query
  if (normType === "question_paper") {
    if (cleanId) return `/qp/${cleanId}`;
    if (item.subject_name) return `/qp/query/${encodeURIComponent(item.subject_name)}`;
    return "/qp";
  }

  return item.resource_url || (cleanId ? `/works/${cleanId}` : "/works");
}

export default function NavbarSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");

  // Direct catalog search state
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [directResults, setDirectResults] = useState(null);

  // AI recommendations state
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [downloadingId, setDownloadingId] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMobileInputOpen, setIsMobileInputOpen] = useState(false);

  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const popupInputRef = useRef(null);
  const containerRef = useRef(null);

  const handleSearch = async (queryText) => {
    const cleanQ = (queryText !== undefined ? queryText : searchTerm).trim();
    if (!cleanQ) return;

    setSubmittedTerm(cleanQ);
    setLoadingDirect(true);
    setLoadingAi(true);
    setDirectResults(null);
    setAiResults(null);
    setIsPopupOpen(true);
    setActiveTab("all");

    // 1. Asynchronous Direct Search
    fetch(`/api/hero-search?q=${encodeURIComponent(cleanQ)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Direct search failed");
        const data = await res.json();
        setDirectResults(data);
      })
      .catch((err) => {
        console.error("Direct search error:", err);
        setDirectResults(null);
      })
      .finally(() => {
        setLoadingDirect(false);
      });

    // 2. Asynchronous AI Recommendations (limit 10)
    fetch("/api/ai-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cleanQ, limit: 10 }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("AI recommendations failed");
        const data = await res.json();
        setAiResults(data.results || []);
      })
      .catch((err) => {
        console.error("AI recommendations error:", err);
        setAiResults([]);
      })
      .finally(() => {
        setLoadingAi(false);
      });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    handleSearch();
  };

  const handleClear = () => {
    setSearchTerm("");
    setSubmittedTerm("");
    setDirectResults(null);
    setAiResults(null);
    setIsPopupOpen(false);
    setIsMobileInputOpen(false);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closePopup();
        setIsMobileInputOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus in-popup search bar when popup opens
  useEffect(() => {
    if (isPopupOpen) {
      const timer = setTimeout(() => {
        popupInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPopupOpen]);

  // Compute total direct matches
  const totalDirectCount = useMemo(() => {
    if (!directResults) return 0;
    return (
      (directResults.updates?.count || 0) +
      (directResults.works?.count || 0) +
      (directResults.materials?.count || 0) +
      (directResults.questionPapers?.count || 0)
    );
  }, [directResults]);

  // Compute available AI category tabs
  const availableTabs = useMemo(() => {
    if (!aiResults || aiResults.length === 0) return [];
    const counts = { all: aiResults.length };
    aiResults.forEach((item) => {
      const type = normalizeResourceType(item.resource_type, item.source_file);
      counts[type] = (counts[type] || 0) + 1;
    });

    const tabs = [{ key: "all", label: "All", count: counts.all }];
    Object.keys(TYPE_CONFIG).forEach((k) => {
      if (counts[k]) {
        tabs.push({
          key: k,
          label: TYPE_CONFIG[k].pluralLabel,
          count: counts[k],
        });
      }
    });
    return tabs;
  }, [aiResults]);

  // Filtered AI results based on selected tab
  const filteredAiResults = useMemo(() => {
    if (!aiResults) return [];
    if (activeTab === "all") return aiResults;
    return aiResults.filter(
      (item) => normalizeResourceType(item.resource_type, item.source_file) === activeTab
    );
  }, [aiResults, activeTab]);

  // Helper to open in new tab
  const openInNewTab = (href) => {
    if (!href) return;
    const targetUrl =
      href.startsWith("http://") || href.startsWith("https://")
        ? href
        : `${window.location.origin}${href}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // When user clicks on an AI suggestion:
  // 1. Replaces the keyword in the search bar
  // 2. Automatically searches that keyword
  // 3. Opens the resource in a new tab (e.g. /works/[id], /updates/[id], or study material)
  const handleItemClick = (e, item) => {
    if (e.target.closest("button.lnx-ai-btn--download")) {
      return;
    }

    const keyword = (item.title || item.subject_name || submittedTerm).trim();

    // Replace keyword in search bar
    setSearchTerm(keyword);

    // Search automatically with this keyword
    handleSearch(keyword);

    // Open suggested resource in a new tab
    const href = getAiItemHref(item);
    openInNewTab(href);
  };

  // Direct View handler for Study Materials:
  // Replaces keyword, triggers search, and opens file in new tab
  const handleViewMaterial = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const keyword = (item.title || item.subject_name || submittedTerm).trim();
    setSearchTerm(keyword);
    handleSearch(keyword);

    const url = item.resource_url || getAiItemHref(item);
    openInNewTab(url);
  };

  // Direct Download handler for Study Materials
  const handleDownloadMaterial = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const url = item.resource_url;
    if (!url) {
      handleViewMaterial(e, item);
      return;
    }

    const downloadKey = item.resource_id || url;
    setDownloadingId(downloadKey);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download request failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanTitle = (item.title || "study-material").trim();
      a.download = cleanTitle.toLowerCase().endsWith(".pdf") ? cleanTitle : `${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.warn("Direct blob download failed, opening in new tab:", err);
      openInNewTab(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const isAnyLoading = loadingDirect || loadingAi;
  const hasDirectResults = directResults && totalDirectCount > 0;

  return (
    <div className="lnx-nav-search-root" ref={containerRef}>
      {/* Desktop Search Form (Navbar header) */}
      <form className="lnx-nav-search-form-desktop" onSubmit={handleSubmit}>
        <FiSearch className="lnx-nav-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="lnx-nav-search-input"
          placeholder="Search Learnix..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search Learnix"
        />
        {searchTerm && (
          <button
            type="button"
            className="lnx-nav-search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <FiX size={13} />
          </button>
        )}
        <button
          type="submit"
          className="lnx-nav-search-submit-btn"
          aria-label="Submit search"
          disabled={isAnyLoading}
        >
          {isAnyLoading ? (
            <span className="lnx-nav-search-spinner" />
          ) : (
            <FiSearch size={13} />
          )}
        </button>
      </form>

      {/* Mobile Search Toggle Icon */}
      <button
        type="button"
        className={`lnx-nav-search-toggle-mobile${isMobileInputOpen ? " lnx-nav-search-toggle-mobile--active" : ""}`}
        onClick={() => {
          setIsMobileInputOpen(!isMobileInputOpen);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        }}
        aria-label="Open navbar search"
      >
        <FiSearch size={20} />
      </button>

      {/* Mobile Drawer Search Bar */}
      {isMobileInputOpen && (
        <div className="lnx-nav-search-mobile-bar-wrap">
          <form className="lnx-nav-search-form-mobile" onSubmit={handleSubmit}>
            <FiSearch className="lnx-nav-search-icon" />
            <input
              ref={mobileInputRef}
              type="text"
              className="lnx-nav-search-input"
              placeholder="Search Learnix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search Learnix"
            />
            {searchTerm && (
              <button
                type="button"
                className="lnx-nav-search-clear-btn"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <FiX size={13} />
              </button>
            )}
            <button
              type="submit"
              className="lnx-nav-search-submit-btn"
              disabled={isAnyLoading}
              aria-label="Search"
            >
              {isAnyLoading ? (
                <span className="lnx-nav-search-spinner" />
              ) : (
                <FiSearch size={13} />
              )}
            </button>
          </form>
          <button
            type="button"
            className="lnx-nav-search-close-mobile-btn"
            onClick={() => setIsMobileInputOpen(false)}
            aria-label="Close search input"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Results Popup Modal */}
      {isPopupOpen && (
        <>
          <div className="lnx-nav-search-backdrop" onClick={closePopup} />
          <div className="lnx-nav-search-popup">
            {/* Popup Header with Title + Close */}
            <div className="lnx-nav-search-popup-header">
              <div className="lnx-nav-search-popup-title">
                Search Results for &ldquo;<span>{submittedTerm}</span>&rdquo;
              </div>
              <button
                type="button"
                className="lnx-nav-search-popup-close"
                onClick={closePopup}
                aria-label="Close search popup"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* In-Popup Search Bar (Search keywords dynamically from inside popup) */}
            <form className="lnx-popup-search-bar" onSubmit={handleSubmit}>
              <FiSearch className="lnx-popup-search-icon" />
              <input
                ref={popupInputRef}
                type="text"
                className="lnx-popup-search-input"
                placeholder="Search keywords, topics, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search within popup"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="lnx-popup-search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear popup input"
                >
                  <FiX size={14} />
                </button>
              )}
              <button
                type="submit"
                className="lnx-popup-search-submit"
                disabled={isAnyLoading}
                aria-label="Search"
              >
                {isAnyLoading ? (
                  <span className="lnx-nav-search-spinner" />
                ) : (
                  <FiSearch size={14} />
                )}
              </button>
            </form>

            {/* ── Top Row: Direct Catalog Matches (First row across all screen sizes) ── */}
            {hasDirectResults ? (
              <div className="lnx-nav-direct-row-wrap">
                <div className="lnx-nav-direct-pills-row">
                  {CATEGORIES.map((cat) => {
                    const data = directResults ? directResults[cat.key] : null;
                    const count = data?.count || 0;
                    const Icon = cat.icon;
                    const targetHref =
                      count > 0
                        ? `${cat.href}?q=${encodeURIComponent(submittedTerm)}`
                        : cat.href;

                    return (
                      <Link
                        key={cat.key}
                        href={targetHref}
                        className={`lnx-nav-cat-pill ${count === 0 ? "lnx-nav-cat-pill--empty" : ""}`}
                        onClick={() => {
                          closePopup();
                          setIsMobileInputOpen(false);
                        }}
                      >
                        <span className={`lnx-nav-cat-pill-icon lnx-nav-cat-icon--${cat.key}`}>
                          <Icon size={13} />
                        </span>
                        <span className="lnx-nav-cat-pill-label">{cat.label}</span>
                        <span className="lnx-nav-cat-pill-count">
                          ({count > 0 ? `${count} found` : "0"})
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : directResults && totalDirectCount === 0 ? (
              /* Space saving subtle note when direct count is 0 */
              <div className="lnx-nav-search-zero-pill">
                <span className="lnx-nav-search-zero-tag">0 direct matches</span>
                <span className="lnx-nav-search-zero-text">Showing AI Suggestions</span>
              </div>
            ) : null}

            {/* Popup Scrollable Body (AI Suggestions section below direct results) */}
            <div className="lnx-nav-search-popup-body">
              {/* ── AI Suggestions Section ── */}
              <div className="lnx-nav-ai-column">
                {loadingAi ? (
                  /* Initial compact AI searching skeleton */
                  <div className="lnx-ai-initial-skeleton">
                    <div className="lnx-ai-skeleton-header">
                      <span className="lnx-ai-sparkle-dot pulse" />
                      <FiZap size={14} className="lnx-ai-zap-icon" />
                      <span>AI is searching & recommending resources for &ldquo;{submittedTerm}&rdquo;...</span>
                    </div>
                    <div className="lnx-ai-skeleton-card">
                      <div className="lnx-ai-skel-line lnx-ai-skel-badge" />
                      <div className="lnx-ai-skel-line lnx-ai-skel-title" />
                      <div className="lnx-ai-skel-line lnx-ai-skel-meta" />
                    </div>
                  </div>
                ) : aiResults && aiResults.length > 0 ? (
                  <div className="lnx-ai-section">
                    {/* AI Section Header */}
                    <div className="lnx-ai-header">
                      <div className="lnx-ai-header-left">
                        <div className="lnx-ai-badge">
                          <FiZap size={13} className="lnx-ai-sparkle-icon" />
                          <span>AI Suggestions</span>
                        </div>
                        <span className="lnx-ai-count-chip">{aiResults.length} found</span>
                      </div>

                      {/* Filter Tabs if multiple types are present */}
                      {availableTabs.length > 2 && (
                        <div className="lnx-ai-tabs-wrap">
                          {availableTabs.map((tab) => (
                            <button
                              key={tab.key}
                              type="button"
                              className={`lnx-ai-tab ${activeTab === tab.key ? "lnx-ai-tab--active" : ""}`}
                              onClick={() => setActiveTab(tab.key)}
                            >
                              <span>{tab.label}</span>
                              <span className="lnx-ai-tab-count">({tab.count})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI Results Cards: Cascading Animation one below another */}
                    <div className="lnx-ai-cards-list">
                      {filteredAiResults.map((item, idx) => {
                        const normType = normalizeResourceType(item.resource_type, item.source_file);
                        const config = TYPE_CONFIG[normType] || TYPE_CONFIG.resource;
                        const Icon = config.icon;
                        const isStudyMaterial = normType === "study_material";
                        const hasUrl = !!item.resource_url;

                        return (
                          <div
                            key={item.resource_id || `ai-${idx}`}
                            className="lnx-ai-card lnx-ai-card--animate"
                            style={{ animationDelay: `${idx * 60}ms` }}
                            onClick={(e) => handleItemClick(e, item)}
                            role="button"
                            tabIndex={0}
                            title="Click to open in new tab & search"
                            onKeyDown={(e) => e.key === "Enter" && handleItemClick(e, item)}
                          >
                            <div className="lnx-ai-card-main">
                              {/* Type badge + match score */}
                              <div className="lnx-ai-card-meta-top">
                                <span className={`lnx-ai-type-pill ${config.badgeClass}`}>
                                  <Icon size={12} />
                                  <span>{config.label}</span>
                                </span>
                                {item.similarity && (
                                  <span className="lnx-ai-similarity-badge">
                                    {Math.round(item.similarity * 100)}% match
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <div className="lnx-ai-card-title">
                                {item.title}
                              </div>

                              {/* Details (Subject, Semester, Course) */}
                              {(item.subject_name || item.course_name || item.semester_number) && (
                                <div className="lnx-ai-card-details">
                                  {item.subject_name && (
                                    <span className="lnx-ai-card-subject">
                                      {item.subject_name}
                                    </span>
                                  )}
                                  {item.semester_number && (
                                    <span className="lnx-ai-card-sem">
                                      Sem {item.semester_number}
                                    </span>
                                  )}
                                  {item.course_name && (
                                    <span className="lnx-ai-card-course">
                                      {item.course_name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Card Actions */}
                            <div className="lnx-ai-card-actions">
                              {isStudyMaterial && hasUrl ? (
                                <div className="lnx-ai-actions-group">
                                  <button
                                    type="button"
                                    className="lnx-ai-btn lnx-ai-btn--view"
                                    onClick={(e) => handleViewMaterial(e, item)}
                                    title="View file in new tab & search"
                                  >
                                    <FiEye size={12} />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="lnx-ai-btn lnx-ai-btn--download"
                                    onClick={(e) => handleDownloadMaterial(e, item)}
                                    disabled={
                                      downloadingId === (item.resource_id || item.resource_url)
                                    }
                                    title="Download file directly"
                                  >
                                    <FiDownload size={12} />
                                    <span>
                                      {downloadingId === (item.resource_id || item.resource_url)
                                        ? "..."
                                        : "Download"}
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <span className="lnx-ai-card-arrow" title="Open resource in new tab">
                                  <FiChevronRight size={18} />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : !loadingAi && !loadingDirect && totalDirectCount === 0 && (!aiResults || aiResults.length === 0) ? (
                  <div className="lnx-nav-search-empty-state">
                    <FiSearch size={26} className="lnx-nav-empty-icon" />
                    <p>No catalog matches or AI suggestions found for &ldquo;{submittedTerm}&rdquo;.</p>
                    <span>Try searching by topics like Operating Systems, DSA, Mathematics, or Java.</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
