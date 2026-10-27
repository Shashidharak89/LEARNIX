"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  { key: "updates", label: "Updates", icon: FiBell, href: "/updates" },
  { key: "works", label: "Resources", icon: FiFolder, href: "/works" },
  { key: "materials", label: "Study Materials", icon: FiBookOpen, href: "/materials" },
  { key: "questionPapers", label: "Question Papers", icon: FiFileText, href: "/qp" },
];

function normalizeResourceType(type) {
  const t = (type || "").toLowerCase().trim();
  if (t === "study_material" || t === "materials" || t === "material") return "study_material";
  if (t === "update" || t === "updates") return "update";
  if (t === "work" || t === "works" || t === "resource" || t === "resources") return "resource";
  if (t === "question_paper" || t === "qp" || t === "questionpapers") return "question_paper";
  return "other";
}

const TYPE_CONFIG = {
  study_material: {
    label: "Study Material",
    pluralLabel: "Study Materials",
    icon: FiBookOpen,
    badgeClass: "lnx-ai-type-pill--study",
  },
  update: {
    label: "Update",
    pluralLabel: "Updates",
    icon: FiBell,
    badgeClass: "lnx-ai-type-pill--update",
  },
  resource: {
    label: "Resource",
    pluralLabel: "Resources",
    icon: FiFolder,
    badgeClass: "lnx-ai-type-pill--resource",
  },
  question_paper: {
    label: "Question Paper",
    pluralLabel: "Question Papers",
    icon: FiFileText,
    badgeClass: "lnx-ai-type-pill--qp",
  },
  other: {
    label: "Recommendation",
    pluralLabel: "Recommendations",
    icon: FiZap,
    badgeClass: "lnx-ai-type-pill--other",
  },
};

function getAiItemHref(item) {
  const normType = normalizeResourceType(item.resource_type);
  const cleanId = item.resource_id ? String(item.resource_id).replace(/^["']|["']$/g, "").trim() : "";

  if (normType === "update") {
    if (cleanId) return `/updates/${cleanId}`;
    if (item.resource_url) return item.resource_url;
    return "/updates";
  }

  if (normType === "study_material") {
    if (item.resource_url) return item.resource_url;
    if (item.subject_name) return `/materials?q=${encodeURIComponent(item.subject_name)}`;
    return "/materials";
  }

  if (normType === "resource") {
    if (cleanId) return `/works/${cleanId}`;
    if (item.resource_url) return item.resource_url;
    return "/works";
  }

  if (normType === "question_paper") {
    if (cleanId) return `/qp/${cleanId}`;
    if (item.subject_name) return `/qp/query/${encodeURIComponent(item.subject_name)}`;
    return "/qp";
  }

  return item.resource_url || "/works";
}

export default function NavbarSearch() {
  const router = useRouter();
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
  const containerRef = useRef(null);

  const handleSearch = async (queryText) => {
    const cleanQ = (queryText !== undefined ? queryText : searchTerm).trim();
    if (!cleanQ) return;

    setSubmittedTerm(cleanQ);
    setLoadingDirect(true);
    setLoadingAi(true);
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
      const type = normalizeResourceType(item.resource_type);
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
      (item) => normalizeResourceType(item.resource_type) === activeTab
    );
  }, [aiResults, activeTab]);

  // Navigate to an AI suggestion
  const handleItemClick = (e, item) => {
    if (e.target.closest("button") || e.target.closest(".lnx-ai-btn")) {
      return;
    }
    const href = getAiItemHref(item);
    closePopup();
    setIsMobileInputOpen(false);

    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
  };

  // Direct View handler for Study Materials
  const handleViewMaterial = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const url = item.resource_url || getAiItemHref(item);
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      closePopup();
      setIsMobileInputOpen(false);
      router.push(url);
    }
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
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const isAnyLoading = loadingDirect || loadingAi;

  return (
    <div className="lnx-nav-search-root" ref={containerRef}>
      {/* Desktop Search Form (Wide screens) */}
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
            {/* Popup Header */}
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

            {/* Popup Body (Scrollable container) */}
            <div className="lnx-nav-search-popup-body">
              {/* ── 1. Direct Catalog Section ── */}
              {loadingDirect ? (
                <div className="lnx-nav-search-direct-loading">
                  <span className="lnx-nav-search-spinner-sm" />
                  <span>Checking catalog...</span>
                </div>
              ) : directResults && totalDirectCount > 0 ? (
                <div className="lnx-nav-direct-section">
                  <div className="lnx-nav-section-title">
                    <span>Catalog Matches</span>
                    <span className="lnx-nav-section-count">({totalDirectCount})</span>
                  </div>
                  <div className="lnx-nav-search-popup-rows">
                    {CATEGORIES.map((cat) => {
                      const data = directResults[cat.key];
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
                          className={`lnx-nav-search-cat-row ${count === 0 ? "lnx-nav-search-cat-row--empty" : ""}`}
                          onClick={() => {
                            closePopup();
                            setIsMobileInputOpen(false);
                          }}
                        >
                          <div className="lnx-nav-search-cat-left">
                            <span className={`lnx-nav-search-cat-icon lnx-nav-cat-icon--${cat.key}`}>
                              <Icon size={18} />
                            </span>
                            <div className="lnx-nav-search-cat-info">
                              <span className="lnx-nav-search-cat-label">{cat.label}</span>
                              <span className="lnx-nav-search-cat-dash">—</span>
                              <span className="lnx-nav-search-cat-count">
                                {count > 0 ? `${count} result${count === 1 ? "" : "s"}` : "0 matches"}
                              </span>
                            </div>
                          </div>
                          <span className="lnx-nav-search-cat-arrow">
                            <FiChevronRight size={18} />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : directResults && totalDirectCount === 0 ? (
                /* Save space: render sleek single-line pill when direct search has 0 results */
                <div className="lnx-nav-search-zero-pill">
                  <span className="lnx-nav-search-zero-tag">0 direct matches</span>
                  <span className="lnx-nav-search-zero-text">Showing AI Smart Suggestions</span>
                </div>
              ) : null}

              {/* ── 2. AI Suggestions Section ── */}
              {loadingAi ? (
                <div className="lnx-ai-loading-box">
                  <div className="lnx-ai-loading-header">
                    <span className="lnx-ai-sparkle-dot pulse" />
                    <FiZap size={14} className="lnx-ai-zap-icon" />
                    <span>AI is finding recommended materials...</span>
                  </div>
                  <div className="lnx-ai-loading-shimmer-row" />
                  <div className="lnx-ai-loading-shimmer-row lnx-ai-loading-shimmer-row--short" />
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
                      <span className="lnx-ai-count-chip">{aiResults.length} recommended</span>
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

                  {/* AI Results Cards */}
                  <div className="lnx-ai-cards-list">
                    {filteredAiResults.map((item, idx) => {
                      const normType = normalizeResourceType(item.resource_type);
                      const config = TYPE_CONFIG[normType] || TYPE_CONFIG.other;
                      const Icon = config.icon;
                      const isStudyMaterial = normType === "study_material";
                      const hasUrl = !!item.resource_url;

                      return (
                        <div
                          key={item.resource_id || `ai-${idx}`}
                          className="lnx-ai-card"
                          onClick={(e) => handleItemClick(e, item)}
                          role="button"
                          tabIndex={0}
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
                            <div className="lnx-ai-card-title" title={item.title}>
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
                                  title="View file"
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
                                  title="Download file"
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
                              <span className="lnx-ai-card-arrow" title="Open resource">
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
                  <p>No catalog matches or AI recommendations found for &ldquo;{submittedTerm}&rdquo;.</p>
                  <span>Try searching by topics like Operating Systems, DSA, Mathematics, or semester names.</span>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
