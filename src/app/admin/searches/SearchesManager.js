"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiArrowLeft,
  FiDownload,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiClock,
  FiDatabase,
  FiGlobe,
  FiFolder,
  FiBell,
  FiBookOpen,
  FiFileText,
  FiNavigation,
  FiHome,
  FiShield
} from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/SearchesManager.css";

const SOURCES = [
  { id: "all", label: "All Sources" },
  { id: "navbar", label: "Navbar", icon: <FiNavigation size={13} /> },
  { id: "home", label: "Home Screen", icon: <FiHome size={13} /> },
  { id: "study-materials", label: "Study Materials", icon: <FiBookOpen size={13} /> },
  { id: "question-papers", label: "Question Papers", icon: <FiFileText size={13} /> },
  { id: "updates", label: "Updates", icon: <FiBell size={13} /> },
  { id: "resources", label: "Resources", icon: <FiFolder size={13} /> }
];

function formatRelativeTime(timestamp) {
  if (!timestamp) return "—";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatAbsoluteTime(timestamp) {
  if (!timestamp) return "";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function SourceBadge({ source }) {
  const s = String(source || "").toLowerCase();
  switch (s) {
    case "navbar":
      return (
        <span className="sm-source-tag sm-src-navbar">
          <FiNavigation size={12} /> Navbar
        </span>
      );
    case "home":
      return (
        <span className="sm-source-tag sm-src-home">
          <FiHome size={12} /> Home Screen
        </span>
      );
    case "study-materials":
      return (
        <span className="sm-source-tag sm-src-study-materials">
          <FiBookOpen size={12} /> Study Materials
        </span>
      );
    case "question-papers":
      return (
        <span className="sm-source-tag sm-src-question-papers">
          <FiFileText size={12} /> Question Papers
        </span>
      );
    case "updates":
      return (
        <span className="sm-source-tag sm-src-updates">
          <FiBell size={12} /> Updates
        </span>
      );
    case "resources":
      return (
        <span className="sm-source-tag sm-src-resources">
          <FiFolder size={12} /> Resources
        </span>
      );
    default:
      return (
        <span className="sm-source-tag sm-src-unknown">
          <FiSearch size={12} /> {source || "Unknown"}
        </span>
      );
  }
}

export default function SearchesManager() {
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeSource, setActiveSource] = useState("all");

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const fetchSearches = useCallback(async (targetPage = page, searchTerm = activeSearch, sourceFilter = activeSource) => {
    setLoading(true);
    setError(null);

    try {
      // Build search query combined with source if selected
      let finalQuery = searchTerm.trim();
      if (sourceFilter !== "all" && !finalQuery.toLowerCase().includes(sourceFilter)) {
        finalQuery = finalQuery ? `${finalQuery} ${sourceFilter}` : sourceFilter;
      }

      const params = new URLSearchParams({
        page: String(targetPage),
        size: String(size),
        search: finalQuery
      });

      const res = await authFetch(`/api/admin/searches?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load searches");
      }

      setData(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setPage(json.page || targetPage);
    } catch (err) {
      console.error("Error fetching searches:", err);
      setError(err.message || "Failed to fetch searches");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, activeSearch, activeSource]);

  useEffect(() => {
    fetchSearches(1, activeSearch, activeSource);
  }, [activeSearch, activeSource]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  };

  const handleSourceChange = (sourceId) => {
    setActiveSource(sourceId);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchSearches(newPage, activeSearch, activeSource);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Direct CSV download
  const handleDownloadCSV = async () => {
    setDownloadingCsv(true);
    try {
      const res = await authFetch("/api/admin/database/export?collection=searches");
      if (!res.ok) throw new Error("Failed to export searches CSV");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Searches_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="sm-container">
      {/* ── Top Navigation & Breadcrumbs ── */}
      <div className="sm-top-nav">
        <Link href="/admin" className="sm-back-link">
          <FiArrowLeft size={16} />
          <span>Back to Admin Dashboard</span>
        </Link>
        <div className="sm-top-badges">
          <span className="sm-live-badge">
            <span className="sm-live-dot" />
            <span>AWS DynamoDB • Live Query Tracker</span>
          </span>
          <Link href="/admin/database" className="sm-back-link" style={{ fontSize: "0.84rem" }}>
            <FiDatabase size={14} />
            <span>Database Management</span>
          </Link>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="sm-header">
        <div className="sm-header-left">
          <div className="sm-header-icon-wrap">
            <FiSearch size={28} />
          </div>
          <div>
            <h1 className="sm-title">
              Search <span className="sm-title-highlight">Keywords</span>
            </h1>
            <p className="sm-subtitle">
              Live queries logged across Navbar, Home Screen, Study Materials, Question Papers, Updates &amp; Resources stored asynchronously in DynamoDB.
            </p>
          </div>
        </div>

        <div className="sm-header-actions">
          <button
            onClick={() => fetchSearches(page, activeSearch, activeSource)}
            disabled={loading}
            className="sm-btn sm-btn-secondary"
            title="Refresh searches"
          >
            <FiRefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={downloadingCsv}
            className="sm-btn sm-btn-primary"
            title="Export full searches dataset as CSV"
          >
            <FiDownload size={16} />
            <span>{downloadingCsv ? "Exporting CSV..." : "Download CSV"}</span>
          </button>
        </div>
      </header>

      {/* ── Toolbar: Search & Meta ── */}
      <div className="sm-toolbar">
        <form onSubmit={handleSearchSubmit} className="sm-search-form">
          <div className="sm-search-input-wrap">
            <FiSearch size={18} className="sm-search-icon" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by keyword, source, user ID, USN, or IP..."
              className="sm-search-input"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="sm-search-clear"
                title="Clear query"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="sm-btn sm-btn-primary" style={{ padding: "0.6rem 1rem" }}>
            Search
          </button>
        </form>

        <div className="sm-toolbar-meta">
          <span>Total Records: <strong className="sm-meta-count">{total}</strong></span>
          <span>•</span>
          <span>Showing page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
        </div>
      </div>

      {/* ── Source Filter Pills ── */}
      <div className="sm-source-pills">
        {SOURCES.map((src) => (
          <button
            key={src.id}
            type="button"
            onClick={() => handleSourceChange(src.id)}
            className={`sm-pill ${activeSource === src.id ? "sm-pill-active" : ""}`}
          >
            {src.icon}
            <span>{src.label}</span>
          </button>
        ))}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Records Table ── */}
      <div className="sm-table-card">
        <div className="sm-table-responsive">
          <table className="sm-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Keyword / Query</th>
                <th style={{ width: "18%" }}>Search Source</th>
                <th style={{ width: "22%" }}>User Identity</th>
                <th style={{ width: "18%" }}>Timestamp</th>
                <th style={{ width: "18%" }}>Client IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeletons
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="sm-skeleton-row">
                    <td><div className="sm-skeleton-bar" style={{ width: "70%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "50%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "65%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "55%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "45%" }} /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="sm-empty">
                      <div className="sm-empty-icon">
                        <FiSearch size={28} />
                      </div>
                      <div className="sm-empty-title">No search queries found</div>
                      <div className="sm-empty-desc">
                        {activeSearch || activeSource !== "all"
                          ? "Try clearing filters or searching for different terms."
                          : "Searches performed across the app will automatically appear here."}
                      </div>
                      {(activeSearch || activeSource !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput("");
                            setActiveSearch("");
                            setActiveSource("all");
                          }}
                          className="sm-btn sm-btn-secondary"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="sm-keyword-wrap">
                        <span className="sm-keyword-badge">
                          <FiSearch size={14} />
                        </span>
                        <span className="sm-keyword-text">{item.keyword}</span>
                      </div>
                    </td>
                    <td>
                      <SourceBadge source={item.source} />
                    </td>
                    <td>
                      <div className="sm-user-wrap">
                        {item.userId ? (
                          <>
                            <div className="sm-user-badge">
                              <FiUser size={12} />
                              {item.usn ? (
                                <span className="sm-usn-chip">{item.usn}</span>
                              ) : (
                                <span>Logged-in User</span>
                              )}
                            </div>
                            <span className="sm-user-id-sub" title={`User ID: ${item.userId}`}>
                              ID: {item.userId.substring(0, 14)}...
                            </span>
                            {item.userEmail && (
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {item.userEmail}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="sm-guest-badge">
                            <FiUser size={11} /> Guest / Anonymous
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="sm-time-wrap">
                        <span className="sm-time-rel">
                          <FiClock size={11} style={{ marginRight: "4px" }} />
                          {formatRelativeTime(item.timestamp || item.createdAt)}
                        </span>
                        <span className="sm-time-abs">
                          {formatAbsoluteTime(item.timestamp || item.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.ip ? (
                        <span className="sm-ip-chip" title={item.userAgent || ""}>
                          {item.ip}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Controls ── */}
        {!loading && totalPages > 1 && (
          <div className="sm-pagination">
            <span className="sm-page-info">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> (20 items/page)
            </span>

            <div className="sm-page-controls">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="sm-page-btn"
              >
                <FiChevronLeft size={16} />
                <span>Prev</span>
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && page > 3) {
                  p = page - 2 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
                }
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`sm-page-btn ${page === p ? "sm-page-active" : ""}`}
                    style={{ minWidth: "36px", justifyContent: "center" }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="sm-page-btn"
              >
                <span>Next</span>
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
