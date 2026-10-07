"use client";
/* global URLSearchParams */

import { useEffect, useState, useCallback, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/clientAuth";
import { formatGithubRawUrl } from "@/lib/githubUrlHelper";
import TransferModal from "./TransferModal";
import {
  FiBook,
  FiFileText,
  FiSearch,
  FiRefreshCw,
  FiRepeat,
  FiChevronLeft,
  FiChevronRight,
  FiGlobe,
  FiLock,
  FiEyeOff,
  FiExternalLink,
  FiSave,
  FiCheck,
  FiX,
  FiUser,
  FiLayers,
  FiFilter,
  FiSliders,
} from "react-icons/fi";
import "./styles/AdminResources.css";

export default function AdminResources({ defaultTab = "subjects" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tabParam = searchParams.get("tab") || defaultTab;
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync activeTab with URL param if changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    startTransition(() => {
      router.push(`/admin/resources?tab=${tab}`);
    });
  };

  // ── Global Filter States ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // { _id, name, usn }
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState(null); // { _id, subject }

  // ── Subjects Tab States ──
  const [subjects, setSubjects] = useState([]);
  const [subjLoading, setSubjLoading] = useState(true);
  const [subjPage, setSubjPage] = useState(1);
  const [subjSize, setSubjSize] = useState(20);
  const [subjTotal, setSubjTotal] = useState(0);
  const [subjTotalPages, setSubjTotalPages] = useState(1);

  // ── Topics Tab States ──
  const [topics, setTopics] = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topPage, setTopPage] = useState(1);
  const [topSize, setTopSize] = useState(20);
  const [topTotal, setTopTotal] = useState(0);
  const [topTotalPages, setTopTotalPages] = useState(1);

  // ── Works Moderation State (Local edits for topics) ──
  const [worksEdits, setWorksEdits] = useState({});

  // ── User Autocomplete List ──
  const [userOptions, setUserOptions] = useState([]);

  // ── Transfer Modal State ──
  const [transferTargetSubject, setTransferTargetSubject] = useState(null);

  // ── Toast Alerts ──
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (message, type = "success") => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // ── Fetch Users for Filter ──
  const searchUsers = useCallback(async (query = "") => {
    try {
      const res = await authFetch(`/api/admin/resources/users?search=${encodeURIComponent(query)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setUserOptions(data.users || []);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    }
  }, []);

  useEffect(() => {
    searchUsers("");
  }, [searchUsers]);

  // ── Fetch Subjects ──
  const fetchSubjects = useCallback(async (page = 1, size = 20, search = "", user = null) => {
    setSubjLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
      });
      if (search) params.append("search", search);
      if (user?._id) params.append("userId", user._id);
      if (user?.usn && !user?._id) params.append("usn", user.usn);

      const res = await authFetch(`/api/admin/resources/subjects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load subjects");

      const data = await res.json();
      setSubjects(data.subjects || []);
      setSubjPage(data.page || 1);
      setSubjTotal(data.total || 0);
      setSubjTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("fetchSubjects error:", err);
      showToast(err.message, "error");
      setSubjects([]);
    } finally {
      setSubjLoading(false);
    }
  }, []);

  // ── Fetch Topics ──
  const fetchTopics = useCallback(async (page = 1, size = 20, search = "", user = null, subjectFilter = null) => {
    setTopLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
      });
      if (search) params.append("search", search);
      if (user?._id) params.append("userId", user._id);
      if (subjectFilter?._id) params.append("subjectId", subjectFilter._id);

      const res = await authFetch(`/api/admin/resources/topics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load topics");

      const data = await res.json();
      setTopics(data.topics || []);
      setTopPage(data.page || 1);
      setTopTotal(data.total || 0);
      setTopTotalPages(data.totalPages || 1);

      // Initialize works edits if in works tab
      const edits = {};
      (data.topics || []).forEach((t) => {
        edits[t._id] = {
          visibility: t.visibility || "public",
          downloadlink: t.downloadlink || "",
          saving: false,
          saved: false,
        };
      });
      setWorksEdits(edits);
    } catch (err) {
      console.error("fetchTopics error:", err);
      showToast(err.message, "error");
      setTopics([]);
    } finally {
      setTopLoading(false);
    }
  }, []);

  // ── Trigger data fetch based on active tab and filters ──
  useEffect(() => {
    if (activeTab === "subjects") {
      fetchSubjects(subjPage, subjSize, activeSearch, selectedUser);
    } else {
      fetchTopics(topPage, topSize, activeSearch, selectedUser, selectedSubjectFilter);
    }
  }, [activeTab, subjPage, subjSize, topPage, topSize, activeSearch, selectedUser, selectedSubjectFilter, fetchSubjects, fetchTopics]);

  // ── Handle Search Submit ──
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
    if (activeTab === "subjects") setSubjPage(1);
    else setTopPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  // ── Filter by User handler ──
  const handleFilterByUser = (user) => {
    setSelectedUser(user);
    if (activeTab === "subjects") setSubjPage(1);
    else setTopPage(1);
  };

  const handleClearUserFilter = () => {
    setSelectedUser(null);
    if (activeTab === "subjects") setSubjPage(1);
    else setTopPage(1);
  };

  // ── Filter Topics by Subject handler ──
  const handleFilterBySubject = (subject) => {
    setSelectedSubjectFilter(subject);
    setTopPage(1);
    switchTab("topics");
  };

  const handleClearSubjectFilter = () => {
    setSelectedSubjectFilter(null);
    setTopPage(1);
  };

  // ── Update Subject Visibility ──
  const handleSubjectVisibilityChange = async (subjectId, newVisibility) => {
    try {
      const res = await authFetch("/api/admin/resources/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, visibility: newVisibility }),
      });
      if (!res.ok) throw new Error("Failed to update subject visibility");
      showToast(`Subject visibility updated to ${newVisibility}.`);
      setSubjects((prev) =>
        prev.map((s) => (s._id === subjectId ? { ...s, visibility: newVisibility } : s))
      );
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Update Topic Visibility or Download Link ──
  const handleTopicSave = async (topicId) => {
    const edit = worksEdits[topicId];
    if (!edit) return;

    setWorksEdits((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], saving: true },
    }));

    try {
      const res = await authFetch("/api/admin/resources/topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          visibility: edit.visibility,
          downloadlink: formatGithubRawUrl(edit.downloadlink),
        }),
      });

      if (!res.ok) throw new Error("Failed to update topic settings");

      setWorksEdits((prev) => ({
        ...prev,
        [topicId]: { ...prev[topicId], saving: false, saved: true },
      }));
      showToast("Topic settings updated successfully.");

      setTimeout(() => {
        setWorksEdits((prev) => ({
          ...prev,
          [topicId]: { ...prev[topicId], saved: false },
        }));
      }, 2500);

      // Update in topics list
      setTopics((prev) =>
        prev.map((t) =>
          t._id === topicId
            ? { ...t, visibility: edit.visibility, downloadlink: formatGithubRawUrl(edit.downloadlink) }
            : t
        )
      );
    } catch (err) {
      showToast(err.message, "error");
      setWorksEdits((prev) => ({
        ...prev,
        [topicId]: { ...prev[topicId], saving: false },
      }));
    }
  };

  // ── Transfer Success Handler ──
  const handleTransferComplete = (data) => {
    showToast(data.message || "Subject successfully transferred!");
    setTransferTargetSubject(null);
    fetchSubjects(subjPage, subjSize, activeSearch, selectedUser);
    if (activeTab === "topics" || activeTab === "works") {
      fetchTopics(topPage, topSize, activeSearch, selectedUser, selectedSubjectFilter);
    }
  };

  return (
    <div className="ar-container">
      {/* ── Header ── */}
      <div className="ar-header">
        <div className="ar-title-wrap">
          <div className="ar-icon-badge">
            <FiLayers size={26} />
          </div>
          <div>
            <h1 className="ar-title">Resource Management</h1>
            <p className="ar-subtitle">
              Manage all subjects, topics, visibilities, external download links &amp; transfer ownership across users.
            </p>
          </div>
        </div>

        <div className="ar-stats-row">
          <div className="ar-stat-pill">
            <FiBook size={16} color="#6366f1" />
            <span>Total Subjects: <strong>{subjTotal}</strong></span>
          </div>
          <div className="ar-stat-pill">
            <FiFileText size={16} color="#10b981" />
            <span>Total Topics: <strong>{topTotal}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Subroute / Navigation Tabs ── */}
      <nav className="ar-nav-tabs">
        <button
          className={`ar-nav-tab ${activeTab === "subjects" ? "active" : ""}`}
          onClick={() => switchTab("subjects")}
        >
          <FiBook size={18} />
          <span>Subjects Management &amp; Transfers</span>
          <span className="ar-nav-count">{subjTotal}</span>
        </button>

        <button
          className={`ar-nav-tab ${activeTab === "topics" ? "active" : ""}`}
          onClick={() => switchTab("topics")}
        >
          <FiFileText size={18} />
          <span>All Topics Explorer</span>
          <span className="ar-nav-count">{topTotal}</span>
        </button>

        <button
          className={`ar-nav-tab ${activeTab === "works" ? "active" : ""}`}
          onClick={() => switchTab("works")}
        >
          <FiSliders size={18} />
          <span>Works Moderation &amp; Links</span>
        </button>
      </nav>

      {/* ── Toast Alert ── */}
      {toast && (
        <div className={`ar-toast ar-toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* ── Control Bar: Search & User Filter ── */}
      <div className="ar-control-bar">
        {/* Search */}
        <form className="ar-search-wrap" onSubmit={handleSearchSubmit}>
          <FiSearch className="ar-search-icon" size={18} />
          <input
            type="text"
            className="ar-search-input"
            placeholder={
              activeTab === "subjects"
                ? "Search subjects by name, owner name, or USN..."
                : "Search topics by title, content, subject, or USN..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Filter Controls */}
        <div className="ar-filters-wrap">
          {/* User selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiUser size={16} color="#64748b" />
            <select
              className="ar-filter-select"
              value={selectedUser?._id || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleClearUserFilter();
                } else {
                  const match = userOptions.find((u) => u._id === val);
                  if (match) handleFilterByUser(match);
                }
              }}
            >
              <option value="">All Users (No User Filter)</option>
              {userOptions.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.usn})
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="ar-btn-refresh"
            onClick={() => {
              if (activeTab === "subjects") {
                fetchSubjects(subjPage, subjSize, activeSearch, selectedUser);
              } else {
                fetchTopics(topPage, topSize, activeSearch, selectedUser, selectedSubjectFilter);
              }
            }}
            title="Refresh list"
          >
            <FiRefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Active Filter Badges ── */}
      {(activeSearch || selectedUser || selectedSubjectFilter) && (
        <div className="ar-active-filters">
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
            <FiFilter size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Active Filters:
          </span>

          {activeSearch && (
            <div className="ar-filter-chip">
              Search: &ldquo;{activeSearch}&rdquo;
              <button onClick={handleClearSearch} title="Clear search">
                <FiX size={14} />
              </button>
            </div>
          )}

          {selectedUser && (
            <div className="ar-filter-chip">
              User: {selectedUser.name} ({selectedUser.usn})
              <button onClick={handleClearUserFilter} title="Clear user filter">
                <FiX size={14} />
              </button>
            </div>
          )}

          {selectedSubjectFilter && (
            <div className="ar-filter-chip">
              Subject: {selectedSubjectFilter.subject}
              <button onClick={handleClearSubjectFilter} title="Clear subject filter">
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: SUBJECTS MANAGEMENT & TRANSFERS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "subjects" && (
        <div className="ar-table-card">
          {subjLoading ? (
            <div className="ar-loading">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <div className="ar-empty-state">
              <FiBook className="ar-empty-icon" />
              <h3>No Subjects Found</h3>
              <p>No subjects match the given query or filter.</p>
            </div>
          ) : (
            <div className="ar-table-responsive">
              <table className="ar-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Owner (User)</th>
                    <th>Visibility</th>
                    <th>Topics</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s._id}>
                      {/* Subject Name */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                          {s.subject}
                        </span>
                        <div>
                          <Link
                            href={`/works/subject/${s._id}`}
                            target="_blank"
                            style={{ fontSize: "0.76rem", color: "#6366f1", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}
                          >
                            <span>Public View</span>
                            <FiExternalLink size={12} />
                          </Link>
                        </div>
                      </td>

                      {/* Owner User */}
                      <td>
                        {s.user ? (
                          <div className="ar-user-cell">
                            {s.user.profileimg ? (
                              <Image
                                src={s.user.profileimg}
                                alt={s.user.name}
                                width={36}
                                height={36}
                                unoptimized
                                className="ar-user-avatar"
                              />
                            ) : (
                              <div className="ar-user-avatar" style={{ display: 'grid', placeItems: 'center' }}>
                                <FiUser size={16} />
                              </div>
                            )}
                            <div className="ar-user-info">
                              <button
                                className="ar-user-filter-btn"
                                onClick={() => handleFilterByUser(s.user)}
                                title="Click to filter all items by this user"
                              >
                                <span className="ar-user-name">{s.user.name}</span>
                              </button>
                              <span className="ar-user-usn">{s.user.usn}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.84rem" }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Visibility */}
                      <td>
                        <select
                          className="ar-visibility-select"
                          value={s.visibility || "public"}
                          onChange={(e) => handleSubjectVisibilityChange(s._id, e.target.value)}
                        >
                          <option value="public">🌐 Public</option>
                          <option value="unlisted">🔗 Unlisted</option>
                          <option value="private">🔒 Private</option>
                        </select>
                      </td>

                      {/* Topics Count */}
                      <td>
                        <button
                          className="ar-btn-view-topics"
                          onClick={() => handleFilterBySubject(s)}
                          title="Click to view all topics under this subject"
                        >
                          <span className="ar-badge-count">{s.topicsCount} Topics</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div className="ar-action-btn-group" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="ar-btn-transfer"
                            onClick={() => setTransferTargetSubject(s)}
                            title="Transfer subject and all topics to another user by USN"
                          >
                            <FiRepeat size={14} />
                            <span>Transfer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="ar-pagination-bar">
            <div className="ar-pagination-info">
              Showing page {subjPage} of {subjTotalPages} ({subjTotal} total subjects)
            </div>

            <div className="ar-pagination-controls">
              <label htmlFor="subjPageSizeSelect" style={{ fontSize: "0.82rem", color: "#64748b", marginRight: 8 }}>Page size:</label>
              <select
                id="subjPageSizeSelect"
                className="ar-filter-select"
                style={{ padding: "4px 8px", marginRight: 12 }}
                value={subjSize}
                onChange={(e) => {
                  setSubjSize(Number(e.target.value));
                  setSubjPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                className="ar-page-btn"
                onClick={() => setSubjPage((p) => Math.max(1, p - 1))}
                disabled={subjPage <= 1}
              >
                <FiChevronLeft size={16} />
              </button>

              <span style={{ fontSize: "0.88rem", fontWeight: 700, padding: "0 6px" }}>
                {subjPage}
              </span>

              <button
                className="ar-page-btn"
                onClick={() => setSubjPage((p) => Math.min(subjTotalPages, p + 1))}
                disabled={subjPage >= subjTotalPages}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: TOPICS EXPLORER
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "topics" && (
        <div className="ar-table-card">
          {topLoading ? (
            <div className="ar-loading">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="ar-empty-state">
              <FiFileText className="ar-empty-icon" />
              <h3>No Topics Found</h3>
              <p>No topics match the given query or filter.</p>
            </div>
          ) : (
            <div className="ar-table-responsive">
              <table className="ar-table">
                <thead>
                  <tr>
                    <th>Topic Title</th>
                    <th>Parent Subject</th>
                    <th>Owner (User)</th>
                    <th>Visibility</th>
                    <th>Download Link</th>
                    <th>Updated</th>
                    <th style={{ textAlign: "right" }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t) => (
                    <tr key={t._id}>
                      {/* Topic Title */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          {t.topic}
                        </span>
                        {t.content && (
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 3, maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.content}
                          </div>
                        )}
                        {Array.isArray(t.images) && t.images.length > 0 && (
                          <span style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 600 }}>
                            📷 {t.images.length} image(s)
                          </span>
                        )}
                      </td>

                      {/* Parent Subject */}
                      <td>
                        <span style={{ fontWeight: 600, color: "#334155" }}>
                          {t.subject || "Unknown Subject"}
                        </span>
                        {t.subjectId && (
                          <div>
                            <button
                              style={{ background: "none", border: "none", color: "#6366f1", fontSize: "0.76rem", cursor: "pointer", padding: 0 }}
                              onClick={() => handleFilterBySubject({ _id: t.subjectId, subject: t.subject })}
                            >
                              Filter by this subject
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Owner User */}
                      <td>
                        {t.userName ? (
                          <div className="ar-user-cell">
                            {t.profileimg ? (
                              <Image
                                src={t.profileimg}
                                alt={t.userName}
                                width={32}
                                height={32}
                                unoptimized
                                className="ar-user-avatar"
                              />
                            ) : (
                              <div className="ar-user-avatar" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center' }}>
                                <FiUser size={14} />
                              </div>
                            )}
                            <div className="ar-user-info">
                              <button
                                className="ar-user-filter-btn"
                                onClick={() => handleFilterByUser({ _id: t.userId, name: t.userName, usn: t.usn })}
                              >
                                <span className="ar-user-name">{t.userName}</span>
                              </button>
                              <span className="ar-user-usn">{t.usn}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.84rem" }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Visibility */}
                      <td>
                        <span className={`ar-badge ar-badge-${t.visibility || "public"}`}>
                          {t.visibility === "private" && <FiLock size={12} />}
                          {t.visibility === "unlisted" && <FiEyeOff size={12} />}
                          {(!t.visibility || t.visibility === "public") && <FiGlobe size={12} />}
                          {t.visibility || "public"}
                        </span>
                      </td>

                      {/* Download Link */}
                      <td>
                        {t.downloadlink ? (
                          <a
                            href={t.downloadlink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#6366f1", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <span>Link</span>
                            <FiExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: "0.82rem" }}>None</span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}
                      </td>

                      {/* Action View */}
                      <td style={{ textAlign: "right" }}>
                        <Link
                          href={`/works/${t._id}`}
                          target="_blank"
                          className="ar-btn-view-topics"
                          style={{ textDecoration: "none" }}
                        >
                          <span>Open</span>
                          <FiExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="ar-pagination-bar">
            <div className="ar-pagination-info">
              Showing page {topPage} of {topTotalPages} ({topTotal} total topics)
            </div>

            <div className="ar-pagination-controls">
              <label htmlFor="topPageSizeSelect" style={{ fontSize: "0.82rem", color: "#64748b", marginRight: 8 }}>Page size:</label>
              <select
                id="topPageSizeSelect"
                className="ar-filter-select"
                style={{ padding: "4px 8px", marginRight: 12 }}
                value={topSize}
                onChange={(e) => {
                  setTopSize(Number(e.target.value));
                  setTopPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                className="ar-page-btn"
                onClick={() => setTopPage((p) => Math.max(1, p - 1))}
                disabled={topPage <= 1}
              >
                <FiChevronLeft size={16} />
              </button>

              <span style={{ fontSize: "0.88rem", fontWeight: 700, padding: "0 6px" }}>
                {topPage}
              </span>

              <button
                className="ar-page-btn"
                onClick={() => setTopPage((p) => Math.min(topTotalPages, p + 1))}
                disabled={topPage >= topTotalPages}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: WORKS MODERATION & DOWNLOAD LINKS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "works" && (
        <div className="ar-table-card">
          <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#0f172a" }}>
              Work Visibility Moderation &amp; External Download Link Manager
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#64748b" }}>
              Configure public visibility and custom external download links (e.g. GitHub raw, Drive) for each work record.
            </p>
          </div>

          {topLoading ? (
            <div className="ar-loading">Loading works records...</div>
          ) : topics.length === 0 ? (
            <div className="ar-empty-state">
              <FiFileText className="ar-empty-icon" />
              <h3>No Work Records Found</h3>
            </div>
          ) : (
            <div className="ar-table-responsive">
              <table className="ar-table">
                <thead>
                  <tr>
                    <th>Work Topic</th>
                    <th>Subject &amp; Owner</th>
                    <th>Visibility Control</th>
                    <th>Custom Download Link</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => {
                    const edit = worksEdits[topic._id] || {
                      visibility: topic.visibility || "public",
                      downloadlink: topic.downloadlink || "",
                      saving: false,
                      saved: false,
                    };

                    return (
                      <tr key={topic._id}>
                        {/* Title */}
                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{topic.topic}</div>
                          <Link
                            href={`/works/${topic._id}`}
                            target="_blank"
                            style={{ fontSize: "0.76rem", color: "#6366f1", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
                          >
                            <span>Open public work page</span>
                            <FiExternalLink size={12} />
                          </Link>
                        </td>

                        {/* Subject & Owner */}
                        <td>
                          <div style={{ fontWeight: 600 }}>{topic.subject || "Unknown"}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {topic.userName} ({topic.usn})
                          </div>
                        </td>

                        {/* Visibility Select */}
                        <td>
                          <select
                            className="ar-visibility-select"
                            value={edit.visibility}
                            onChange={(e) =>
                              setWorksEdits((prev) => ({
                                ...prev,
                                [topic._id]: { ...prev[topic._id], visibility: e.target.value },
                              }))
                            }
                          >
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="private">Private</option>
                          </select>
                        </td>

                        {/* Download link input */}
                        <td>
                          <input
                            type="text"
                            className="ar-search-input"
                            style={{ padding: "7px 12px", fontSize: "0.84rem", minWidth: 260 }}
                            placeholder="https://raw.githubusercontent.com/... or link"
                            value={edit.downloadlink}
                            onChange={(e) =>
                              setWorksEdits((prev) => ({
                                ...prev,
                                [topic._id]: { ...prev[topic._id], downloadlink: e.target.value },
                              }))
                            }
                          />
                        </td>

                        {/* Save Action */}
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="ar-btn-transfer"
                            style={{
                              background: edit.saved
                                ? "#10b981"
                                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            }}
                            onClick={() => handleTopicSave(topic._id)}
                            disabled={edit.saving}
                          >
                            {edit.saving ? (
                              <span>Saving...</span>
                            ) : edit.saved ? (
                              <>
                                <FiCheck size={14} /> Saved
                              </>
                            ) : (
                              <>
                                <FiSave size={14} /> Save
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="ar-pagination-bar">
            <div className="ar-pagination-info">
              Showing page {topPage} of {topTotalPages} ({topTotal} records)
            </div>

            <div className="ar-pagination-controls">
              <button
                className="ar-page-btn"
                onClick={() => setTopPage((p) => Math.max(1, p - 1))}
                disabled={topPage <= 1}
              >
                <FiChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, padding: "0 6px" }}>
                {topPage}
              </span>
              <button
                className="ar-page-btn"
                onClick={() => setTopPage((p) => Math.min(topTotalPages, p + 1))}
                disabled={topPage >= topTotalPages}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Subject Modal ── */}
      {transferTargetSubject && (
        <TransferModal
          subject={transferTargetSubject}
          onClose={() => setTransferTargetSubject(null)}
          onTransferSuccess={handleTransferComplete}
        />
      )}
    </div>
  );
}
