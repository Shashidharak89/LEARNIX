"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiSearch,
  FiArrowLeft,
  FiDownload,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiDatabase,
  FiFolder,
  FiBell,
  FiBookOpen,
  FiFileText,
  FiNavigation,
  FiHome,
  FiExternalLink,
  FiShield,
  FiMail,
  FiHash,
  FiMonitor,
  FiSmartphone
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

function formatCleanTimestamp(timestamp) {
  if (!timestamp) return "—";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";

  // Clean date without seconds or milliseconds: "01 Nov 2026, 09:32 am"
  const formatted = date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return formatted.replace(/\s(AM|PM)$/i, (m) => m.toLowerCase());
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

function OsBadge({ os }) {
  const o = String(os || "").toLowerCase();
  const isMobile = o.includes("android") || o.includes("ios");
  return (
    <span className="sm-os-badge" title={`OS: ${os || "Unknown"}`}>
      {isMobile ? <FiSmartphone size={12} /> : <FiMonitor size={12} />}
      <span>{os || "Unknown"}</span>
    </span>
  );
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

  // User details modal state
  const [activeUserModal, setActiveUserModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalUserData, setModalUserData] = useState(null);
  const [modalError, setModalError] = useState(null);

  const fetchSearches = useCallback(async (targetPage = page, searchTerm = activeSearch, sourceFilter = activeSource) => {
    setLoading(true);
    setError(null);

    try {
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

  // Check user info popup trigger
  const handleOpenUserModal = async (record) => {
    if (!record?.userId && !record?.usn) return;
    setActiveUserModal(record);
    setModalLoading(true);
    setModalError(null);
    setModalUserData(null);

    try {
      const queryParams = new URLSearchParams();
      if (record.userId) queryParams.set("userId", record.userId);
      if (record.usn) queryParams.set("usn", record.usn);

      const res = await authFetch(`/api/admin/searches/user-info?${queryParams.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load user details");
      }

      setModalUserData(json.user);
    } catch (err) {
      setModalError(err.message || "User profile could not be loaded");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseUserModal = () => {
    setActiveUserModal(null);
    setModalUserData(null);
    setModalError(null);
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
              placeholder="Search by keyword, source, user ID, USN, or OS..."
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
                <th style={{ width: "25%" }}>Keyword / Query</th>
                <th style={{ width: "18%" }}>Search Source</th>
                <th style={{ width: "15%" }}>User</th>
                <th style={{ width: "14%" }}>OS</th>
                <th style={{ width: "20%" }}>Timestamp</th>
                <th style={{ width: "8%" }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="sm-skeleton-row">
                    <td><div className="sm-skeleton-bar" style={{ width: "70%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "50%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "45%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "40%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "60%" }} /></td>
                    <td><div className="sm-skeleton-bar" style={{ width: "35%" }} /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6}>
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
                      {item.userId || item.usn ? (
                        <button
                          type="button"
                          onClick={() => handleOpenUserModal(item)}
                          className="sm-check-user-btn"
                          title="Click to view user profile details"
                        >
                          <FiUser size={13} />
                          <span>Check User</span>
                        </button>
                      ) : (
                        <span className="sm-empty-dash">—</span>
                      )}
                    </td>
                    <td>
                      <OsBadge os={item.os} />
                    </td>
                    <td>
                      <span className="sm-time-clean">
                        {formatCleanTimestamp(item.timestamp || item.createdAt)}
                      </span>
                    </td>
                    <td>
                      {item.ip ? (
                        <span className="sm-ip-chip" title={item.userAgent || ""}>
                          {item.ip}
                        </span>
                      ) : (
                        <span className="sm-empty-dash">—</span>
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

      {/* ── User Profile Popup Modal ── */}
      {activeUserModal && (
        <div className="sm-modal-backdrop" onClick={handleCloseUserModal}>
          <div className="sm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <div className="sm-modal-title-wrap">
                <div className="sm-modal-icon-badge">
                  <FiUser size={18} />
                </div>
                <h3>User Information</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseUserModal}
                className="sm-modal-close-btn"
                title="Close popup"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="sm-modal-body">
              {modalLoading ? (
                <div className="sm-modal-loading">
                  <FiRefreshCw size={24} className="spin" />
                  <span>Loading user details...</span>
                </div>
              ) : modalError ? (
                <div className="sm-modal-error">
                  <p>{modalError}</p>
                  {activeUserModal.usn && (
                    <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      USN: <code>{activeUserModal.usn}</code>
                    </p>
                  )}
                </div>
              ) : modalUserData ? (
                <div className="sm-user-profile-details">
                  <div className="sm-user-avatar-section">
                    {modalUserData.profileimg ? (
                      <img
                        src={modalUserData.profileimg}
                        alt={modalUserData.name}
                        className="sm-user-avatar-img"
                      />
                    ) : (
                      <div className="sm-user-avatar-fallback">
                        {(modalUserData.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="sm-user-main-info">
                      <h4 className="sm-user-name">{modalUserData.name}</h4>
                      <span className="sm-user-role-tag">{modalUserData.role}</span>
                    </div>
                  </div>

                  <div className="sm-user-info-grid">
                    <div className="sm-user-info-row">
                      <span className="sm-user-info-label">
                        <FiHash size={14} /> USN
                      </span>
                      <strong className="sm-user-info-val sm-user-usn-highlight">
                        {modalUserData.usn || "N/A"}
                      </strong>
                    </div>

                    <div className="sm-user-info-row">
                      <span className="sm-user-info-label">
                        <FiMail size={14} /> Email
                      </span>
                      <span className="sm-user-info-val">
                        {modalUserData.email || "No email available"}
                      </span>
                    </div>
                  </div>

                  <div className="sm-modal-actions">
                    {modalUserData.usn && (
                      <Link
                        href={`/admin/user/${encodeURIComponent(modalUserData.usn)}`}
                        className="sm-btn sm-btn-primary sm-modal-btn"
                      >
                        <FiShield size={16} />
                        <span>Admin Profile</span>
                      </Link>
                    )}

                    {modalUserData.usn && (
                      <Link
                        href={`/users/${encodeURIComponent(modalUserData.usn)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-btn sm-btn-secondary sm-modal-btn"
                      >
                        <FiExternalLink size={16} />
                        <span>Public Profile</span>
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
