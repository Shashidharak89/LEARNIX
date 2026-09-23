"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { BookOpenText } from "lucide-react";
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
import "./styles/Footer.css";
import "./styles/HeroSearch.css";

// ── Animated placeholder captions ───────────────────────────────────────────
const PLACEHOLDERS = [
  "What's on your mind?",
  "Search notes, papers & more…",
  "Try 'Data Structures & Algorithms'…",
  "Find Nitte question papers…",
  "Search 'Machine Learning notes'…",
  "Look for 'Mathematics 3'…",
  "Type 'Operating Systems'…",
  "Explore latest updates…",
  "Search 'Computer Networks'…",
  "Find lab manuals & study guides…",
  "Search 'Software Engineering'…",
  "Looking for placement materials?…",
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

// ── Typing animation hook (Always keeps typing in an infinite loop) ───────
function useTypingPlaceholder(captions, typingSpeed = 65, pauseMs = 1600, deleteSpeed = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!captions || captions.length === 0) return;

    const currentCaption = captions[index % captions.length];

    if (!isDeleting && subIndex === currentCaption.length) {
      // Pause when full text is typed, then switch to deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseMs);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && subIndex === 0) {
      // Finished deleting, move to next caption
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % captions.length);
      return;
    }

    const timeout = setTimeout(() => {
      const nextSubIndex = subIndex + (isDeleting ? -1 : 1);
      setSubIndex(nextSubIndex);
      setDisplayedText(currentCaption.substring(0, nextSubIndex));
    }, isDeleting ? deleteSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting, captions, typingSpeed, pauseMs, deleteSpeed]);

  return displayedText;
}

// ── Item renderers (Single row layout with ellipsis truncation) ────────────

function renderWorkItem(item) {
  return (
    <li key={item._id} className="lnx-search-card-item">
      <Link href={`/works/${item._id}`} className="lnx-search-card-item-link" title={item.topic}>
        <span className="lnx-search-card-item-dot" />
        <span className="lnx-search-card-item-text">{item.topic}</span>
      </Link>
    </li>
  );
}

function renderUpdateItem(item) {
  return (
    <li key={item._id} className="lnx-search-card-item">
      <Link href={`/updates/${item._id}`} className="lnx-search-card-item-link" title={item.title}>
        <span className="lnx-search-card-item-dot" />
        <span className="lnx-search-card-item-text">{item.title}</span>
      </Link>
    </li>
  );
}

function renderMaterialItem(item, idx) {
  return (
    <li key={`mat-${idx}`} className="lnx-search-card-item">
      <Link href={`/materials?q=${encodeURIComponent(item.subject)}`} className="lnx-search-card-item-link" title={`${item.subject} (${item.semester})`}>
        <span className="lnx-search-card-item-dot" />
        <span className="lnx-search-card-item-text">{item.subject}</span>
      </Link>
    </li>
  );
}

function renderQPItem(item, idx) {
  const subjectName = item.name || item.title || item.subject || "Untitled Subject";
  const targetHref = item._id && !item._id.includes("_")
    ? `/qp/${item._id}`
    : `/qp?q=${encodeURIComponent(subjectName)}`;

  return (
    <li key={item._id || `qp-${idx}`} className="lnx-search-card-item">
      <Link href={targetHref} className="lnx-search-card-item-link" title={subjectName}>
        <span className="lnx-search-card-item-dot" />
        <span className="lnx-search-card-item-text">{subjectName}</span>
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
    <div className="lnx-search" id="hero-search">
      {/* ── Header Title & Interactive Help Tooltip (Smooth transition on typing & clearing) ── */}
      <div className={`lnx-search-header ${query.trim().length > 0 || hasSearched ? "lnx-search-header--hidden" : ""}`}>
        <h2 className="lnx-search-main-headline">
          <BookOpenText className="lnx-search-headline-book" size={32} /> Quick Resource Finder
          <div className="lnx-search-info-wrap">
            <button
              type="button"
              className="lnx-search-info-btn"
              aria-label="Search Info & Hints"
            >
              <FiHelpCircle className="lnx-info-icon" />
            </button>
            <div className="lnx-search-tooltip" role="tooltip">
              <div className="lnx-search-tooltip-title">
                Search Question Papers &amp; Materials on <strong>LEARNIX</strong>
              </div>
              <p className="lnx-search-tooltip-text">
                Type anything you want to explore on Learnix. Keywords separated by spaces are matched across all notes, syllabus &amp; papers.
              </p>
            </div>
          </div>
        </h2>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="lnx-search-bar-wrapper">
        <form className="lnx-search-bar" onSubmit={handleFormSubmit}>
          <span className="lnx-search-dot-wrap" aria-hidden="true">
            <span className="lnx-search-dot" />
          </span>

          <input
            ref={inputRef}
            type="text"
            className="lnx-search-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search Learnix"
            id="hero-search-input"
          />

          {/* Clear button */}
          {(query.length > 0 || hasSearched) && (
            <button
              type="button"
              className="lnx-search-clear"
              onClick={handleClear}
              aria-label="Clear search"
              id="hero-search-clear-btn"
            >
              <FiX />
            </button>
          )}

          <button
            type="submit"
            className="lnx-search-submit"
            aria-label="Search"
            id="hero-search-btn"
            disabled={loading}
          >
            {loading ? <span className="lnx-search-spinner" /> : <FiSearch />}
          </button>
        </form>
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {hasSearched && !loading && results && (
        <div className="lnx-search-results">
          {isEmpty ? (
            <div className="lnx-search-empty">
              <div className="lnx-search-empty-icon">🔍</div>
              No results found for &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            <>
              {/* Desktop grid */}
              {totalResults > 0 && (
                <div className="lnx-search-grid">
                  {CATEGORIES.map((cat) => {
                    const data = results[cat.key];
                    const items = data?.items || [];
                    const count = data?.count || 0;
                    const renderItem = ITEM_RENDERERS[cat.key];
                    const Icon = cat.icon;

                    return (
                      <div key={cat.key} className="lnx-search-card">
                        <div className="lnx-search-card-head">
                          <span className={`lnx-search-card-icon lnx-search-card-icon--${cat.theme}`}>
                            <Icon />
                          </span>
                          <div>
                            <div className="lnx-search-card-title">{cat.label}</div>
                            <div className="lnx-search-card-count">
                              {count > 0 ? `${count} found` : "0 matches"}
                            </div>
                          </div>
                        </div>

                        {count > 0 ? (
                          <>
                            <ul className="lnx-search-card-list">
                              {items.map((item, idx) => renderItem(item, idx))}
                            </ul>
                            <Link
                              href={`${cat.href}?${cat.paramKey}=${encodeURIComponent(searchTerm)}`}
                              className="lnx-search-viewmore"
                            >
                              View more <FiArrowRight />
                            </Link>
                          </>
                        ) : (
                          <div className="lnx-search-card-empty-wrap">
                            <Link href={cat.href} className="lnx-search-explore-btn">
                              Explore {cat.label} <FiArrowRight />
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mobile / Small screen wrap pills (icons + count badge or explore action, zero horizontal scrolling) */}
              <div className="lnx-search-mwrap">
                {CATEGORIES.map((cat) => {
                  const data = results[cat.key];
                  const count = data?.count || 0;
                  const Icon = cat.icon;

                  return (
                    <Link
                      key={cat.key}
                      href={count > 0 ? `${cat.href}?${cat.paramKey}=${encodeURIComponent(searchTerm)}` : cat.href}
                      className={`lnx-search-mpill ${count === 0 ? "lnx-search-mpill--explore" : ""}`}
                      title={count > 0 ? `${cat.label}: ${count} found` : `Explore ${cat.label}`}
                      aria-label={count > 0 ? `${cat.label}: ${count} found` : `Explore ${cat.label}`}
                    >
                      <span className={`lnx-search-mpill-icon lnx-search-card-icon--${cat.theme}`}>
                        <Icon />
                      </span>
                      <span className="lnx-search-mpill-count">
                        {count > 0 ? count : `Explore ${cat.label}`}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Page shortcut links */}
              {hasPages && (
                <div className="lnx-search-pages">
                  {results.pages.map((page) => {
                    const IconComp = ICON_MAP[page.icon] || FiSearch;
                    return (
                      <Link
                        key={page.href}
                        href={`${page.href}?q=${encodeURIComponent(searchTerm)}`}
                        className="lnx-search-page-link"
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