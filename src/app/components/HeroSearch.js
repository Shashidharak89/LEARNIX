"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiArrowRight,
  FiFolder,
  FiBookOpen,
  FiFileText,
  FiBell,
  FiTrendingUp,
  FiTool,
  FiHelpCircle,
  FiMessageSquare,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroSearch.css";

// ── Animated placeholder captions ───────────────────────────────────────────
const PLACEHOLDERS = [
  "What's on your mind?",
  "Search notes, papers & more…",
  "Try 'Data Structures'…",
  "Find study materials…",
  "Search question papers…",
  "Looking for updates?",
  "Try 'Mathematics'…",
  "Explore student works…",
];

// ── Icon map (string → component) ──────────────────────────────────────────
const ICON_MAP = {
  FiSearch: FiSearch,
  FiFolder: FiFolder,
  FiBookOpen: FiBookOpen,
  FiFileText: FiFileText,
  FiBell: FiBell,
  FiTrendingUp: FiTrendingUp,
  FiTool: FiTool,
  FiHelpCircle: FiHelpCircle,
  FiMessageSquare: FiMessageSquare,
  FiUpload: FiUpload,
  HiAcademicCap: HiAcademicCap,
};

// ── Category meta ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "works", label: "Works", icon: FiFolder, href: "/works", theme: "works", paramKey: "q" },
  { key: "updates", label: "Updates", icon: FiBell, href: "/updates", theme: "updates", paramKey: "q" },
  { key: "materials", label: "Materials", icon: FiBookOpen, href: "/materials", theme: "materials", paramKey: "q" },
  { key: "questionPapers", label: "Question Papers", icon: FiFileText, href: "/qp", theme: "qp", paramKey: "q" },
];

// ── Typing animation hook ──────────────────────────────────────────────────
function useTypingPlaceholder(captions, typingSpeed = 60, pauseMs = 1800, deleteSpeed = 35) {
  const [text, setText] = useState("");
  const [captionIdx, setCaptionIdx] = useState(0);
  const phase = useRef("typing"); // typing | pausing | deleting
  const charIdx = useRef(0);

  useEffect(() => {
    const caption = captions[captionIdx];
    let timer;

    if (phase.current === "typing") {
      if (charIdx.current < caption.length) {
        timer = setTimeout(() => {
          charIdx.current += 1;
          setText(caption.slice(0, charIdx.current));
        }, typingSpeed);
      } else {
        phase.current = "pausing";
        timer = setTimeout(() => {
          phase.current = "deleting";
          setText(caption); // trigger re-render
        }, pauseMs);
      }
    } else if (phase.current === "deleting") {
      if (charIdx.current > 0) {
        timer = setTimeout(() => {
          charIdx.current -= 1;
          setText(caption.slice(0, charIdx.current));
        }, deleteSpeed);
      } else {
        phase.current = "typing";
        setCaptionIdx((prev) => (prev + 1) % captions.length);
      }
    } else if (phase.current === "pausing") {
      // Wait — handled by typing branch
    }

    return () => clearTimeout(timer);
  }, [text, captionIdx, captions, typingSpeed, pauseMs, deleteSpeed]);

  return text;
}

// ── Item renderers ─────────────────────────────────────────────────────────

function renderWorkItem(item) {
  return (
    <li key={item._id} className="hero-search-cat-item">
      <Link href={`/works/${item._id}`} className="hero-search-cat-item-link">
        <span className="hero-search-cat-item-dot" />
        <div>
          <div className="hero-search-cat-item-text">{item.topic}</div>
          {item.subject && (
            <div className="hero-search-cat-item-meta">{item.subject}</div>
          )}
        </div>
      </Link>
    </li>
  );
}

function renderUpdateItem(item) {
  return (
    <li key={item._id} className="hero-search-cat-item">
      <Link href={`/updates/${item._id}`} className="hero-search-cat-item-link">
        <span className="hero-search-cat-item-dot" />
        <div>
          <div className="hero-search-cat-item-text">{item.title}</div>
          {item.userName && (
            <div className="hero-search-cat-item-meta">by {item.userName}</div>
          )}
        </div>
      </Link>
    </li>
  );
}

function renderMaterialItem(item, idx) {
  return (
    <li key={`mat-${idx}`} className="hero-search-cat-item">
      <Link href={`/materials?q=${encodeURIComponent(item.subject)}`} className="hero-search-cat-item-link">
        <span className="hero-search-cat-item-dot" />
        <div>
          <div className="hero-search-cat-item-text">{item.subject}</div>
          <div className="hero-search-cat-item-meta">
            {item.semester} · {item.fileCount} files
          </div>
        </div>
      </Link>
    </li>
  );
}

function renderQPItem(item) {
  const targetHref = item.id ? `/qp/${item.id}` : `/qp`;
  return (
    <li key={item.id} className="hero-search-cat-item">
      <Link href={targetHref} className="hero-search-cat-item-link">
        <span className="hero-search-cat-item-dot" />
        <div>
          <div className="hero-search-cat-item-text">
            {item.semesterLabel || `Semester ${item.semester}`}
          </div>
          <div className="hero-search-cat-item-meta">
            {item.batch} · {item.examType} · {item.totalSubjects} subjects
          </div>
        </div>
      </Link>
    </li>
  );
}

const ITEM_RENDERERS = {
  works: renderWorkItem,
  updates: renderUpdateItem,
  materials: renderMaterialItem,
  questionPapers: renderQPItem,
};

// ═══════════════════════════════════════════════════════════════════════════
// HeroSearch Component
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  const placeholder = useTypingPlaceholder(PLACEHOLDERS);

  // ── Search handler ────────────────────────────────────────────────────
  const doSearch = useCallback(async (customQ) => {
    const rawTarget = typeof customQ === "string" ? customQ : query;
    const cleanTarget = rawTarget.trim();
    const finalQ = cleanTarget || placeholder.replace(/['"…]/g, "").trim();
    if (!finalQ) return;

    setLoading(true);
    setHasSearched(true);
    setSearchTerm(finalQ);

    // Update browser URL query parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("q", finalQ);
      window.history.pushState({}, "", url.toString());
    }

    try {
      const res = await fetch(`/api/hero-search?q=${encodeURIComponent(finalQ)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("HeroSearch error:", err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, placeholder]);

  // Initial check for URL query parameter
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qFromUrl = params.get("q");
    if (qFromUrl) {
      setQuery(qFromUrl);
      doSearch(qFromUrl);
    }
  }, []);

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    doSearch();
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setHasSearched(false);
    setSearchTerm("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      window.history.pushState({}, "", url.toString());
    }
    inputRef.current?.focus();
  };

  // ── Check if any results at all ───────────────────────────────────────
  const totalResults =
    results
      ? (results.works?.count || 0) +
      (results.updates?.count || 0) +
      (results.materials?.count || 0) +
      (results.questionPapers?.count || 0)
      : 0;

  const hasPages = results?.pages?.length > 0;
  const isEmpty = hasSearched && !loading && totalResults === 0 && !hasPages;

  return (
    <div className="hero-search-root" id="hero-search">
      {/* ── Search bar form ─────────────────────────────────────────────── */}
      <form className="hero-search-bar" onSubmit={handleFormSubmit}>
        <span className="hero-search-sparkle" aria-hidden="true">
          <span className="hero-search-sparkle-dot" />
        </span>

        <input
          ref={inputRef}
          type="text"
          className="hero-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search Learnix"
          id="hero-search-input"
        />

        {/* Clear Cross Icon */}
        {(query.length > 0 || hasSearched) && (
          <button
            type="button"
            className="hero-search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
            id="hero-search-clear-btn"
          >
            <FiX />
          </button>
        )}

        <button
          type="submit"
          className={`hero-search-btn${loading ? " hero-search-btn-loading" : ""}`}
          aria-label="Search"
          id="hero-search-btn"
          disabled={loading}
        >
          {loading ? (
            <span className="hero-search-spinner" />
          ) : (
            <FiSearch />
          )}
        </button>
      </form>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {hasSearched && !loading && results && (
        <div className="hero-search-results">
          {isEmpty ? (
            <div className="hero-search-empty">
              <div className="hero-search-empty-icon">🔍</div>
              No results found for &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            <>
              {/* Desktop grid */}
              {totalResults > 0 && (
                <div className="hero-search-grid">
                  {CATEGORIES.map((cat) => {
                    const data = results[cat.key];
                    const items = data?.items || [];
                    const count = data?.count || 0;
                    const renderItem = ITEM_RENDERERS[cat.key];
                    const Icon = cat.icon;

                    return (
                      <div key={cat.key} className="hero-search-category">
                        <div className="hero-search-cat-header">
                          <span className={`hero-search-cat-icon hero-search-cat-icon--${cat.theme}`}>
                            <Icon />
                          </span>
                          <div>
                            <div className="hero-search-cat-title">{cat.label}</div>
                            <div className="hero-search-cat-count">
                              {count} found
                            </div>
                          </div>
                        </div>

                        {count > 0 ? (
                          <>
                            <ul className="hero-search-cat-list">
                              {items.map((item, idx) => renderItem(item, idx))}
                            </ul>
                            <Link
                              href={`${cat.href}?${cat.paramKey}=${encodeURIComponent(searchTerm)}`}
                              className="hero-search-viewmore"
                            >
                              View more <FiArrowRight />
                            </Link>
                          </>
                        ) : (
                          <div className="hero-search-cat-empty">
                            No matches
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mobile scroll cards */}
              {totalResults > 0 && (
                <div className="hero-search-mobile-scroll">
                  {CATEGORIES.map((cat) => {
                    const data = results[cat.key];
                    const count = data?.count || 0;
                    if (count === 0) return null;
                    const Icon = cat.icon;

                    return (
                      <Link
                        key={cat.key}
                        href={`${cat.href}?${cat.paramKey}=${encodeURIComponent(searchTerm)}`}
                        className="hero-search-mobile-card"
                      >
                        <span className={`hero-search-mobile-icon hero-search-cat-icon--${cat.theme}`}>
                          <Icon />
                        </span>
                        <span className="hero-search-mobile-info">
                          <span className="hero-search-mobile-count">
                            {count} found
                          </span>
                          <span className="hero-search-mobile-label">
                            {cat.label}
                          </span>
                        </span>
                        <FiArrowRight className="hero-search-mobile-arrow" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Page shortcut links */}
              {hasPages && (
                <div className="hero-search-pages">
                  {results.pages.map((page) => {
                    const IconComp = ICON_MAP[page.icon] || FiSearch;
                    return (
                      <Link
                        key={page.href}
                        href={`${page.href}?q=${encodeURIComponent(searchTerm)}`}
                        className="hero-search-page-link"
                      >
                        <IconComp />
                        {page.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
