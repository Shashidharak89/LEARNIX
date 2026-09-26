"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiX,
  FiBell,
  FiFolder,
  FiBookOpen,
  FiFileText,
  FiChevronRight,
} from "react-icons/fi";
import "./styles/NavbarSearch.css";

const CATEGORIES = [
  { key: "updates", label: "Updates", icon: FiBell, href: "/updates" },
  { key: "works", label: "Works", icon: FiFolder, href: "/works" },
  { key: "materials", label: "Study Materials", icon: FiBookOpen, href: "/materials" },
  { key: "questionPapers", label: "Question Papers", icon: FiFileText, href: "/qp" },
];

export default function NavbarSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMobileInputOpen, setIsMobileInputOpen] = useState(false);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const containerRef = useRef(null);

  const handleSearch = async (queryText) => {
    const cleanQ = (queryText !== undefined ? queryText : searchTerm).trim();
    if (!cleanQ) return;

    setSubmittedTerm(cleanQ);
    setLoading(true);
    setIsPopupOpen(true);

    try {
      const res = await fetch(`/api/hero-search?q=${encodeURIComponent(cleanQ)}`);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Navbar search error:", err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    handleSearch();
  };

  const handleClear = () => {
    setSearchTerm("");
    setSubmittedTerm("");
    setResults(null);
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
          disabled={loading}
        >
          {loading ? <span className="lnx-nav-search-spinner" /> : <FiSearch size={13} />}
        </button>
      </form>

      {/* Mobile Search Toggle Icon (Initially shown on small screens) */}
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

      {/* Mobile Drawer Search Bar (Expanded when search icon clicked on mobile) */}
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
            <button type="submit" className="lnx-nav-search-submit-btn" disabled={loading} aria-label="Search">
              {loading ? <span className="lnx-nav-search-spinner" /> : <FiSearch size={13} />}
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

      {/* High Z-Index Popup Results Overlay Modal */}
      {isPopupOpen && (
        <>
          <div className="lnx-nav-search-backdrop" onClick={closePopup} />
          <div className="lnx-nav-search-popup">
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

            {loading ? (
              <div className="lnx-nav-search-popup-loading">
                <span className="lnx-nav-search-spinner-lg" />
                Searching resources...
              </div>
            ) : results ? (
              <div className="lnx-nav-search-popup-rows">
                {CATEGORIES.map((cat) => {
                  const data = results[cat.key];
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
                            {count > 0 ? `${count} result${count === 1 ? "" : "s"} found` : "0 matches"}
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
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
