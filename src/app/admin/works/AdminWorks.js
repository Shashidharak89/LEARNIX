"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/clientAuth";
import { formatGithubRawUrl } from "@/lib/githubUrlHelper";
import {
  FiFileText,
  FiLink,
  FiEye,
  FiSave,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiGlobe,
  FiLock,
  FiEyeOff,
  FiExternalLink,
} from "react-icons/fi";
import "./styles/AdminWorks.css";

export default function AdminWorks() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Local draft state for edits per topicId: { [topicId]: { visibility, downloadlink, saving, successMsg } }
  const [edits, setEdits] = useState({});

  const fetchAdminWorks = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/works?page=${pageNum}&pageSize=10`);
      if (!res.ok) {
        throw new Error("Failed to load admin works");
      }
      const data = await res.json();
      setTopics(data.topics || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);

      // Initialize draft edits state
      const initialEdits = {};
      (data.topics || []).forEach((t) => {
        initialEdits[t._id] = {
          visibility: t.visibility || "public",
          downloadlink: t.downloadlink || "",
          saving: false,
          successMsg: false,
        };
      });
      setEdits(initialEdits);
    } catch (err) {
      console.error("AdminWorks fetch error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminWorks(page);
  }, [page]);

  const handleVisibilityChange = (topicId, val) => {
    setEdits((prev) => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        visibility: val,
      },
    }));
  };

  const handleDownloadLinkChange = (topicId, val) => {
    const formatted = formatGithubRawUrl(val);
    setEdits((prev) => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        downloadlink: formatted,
      },
    }));
  };

  const handleSave = async (topicId) => {
    const draft = edits[topicId];
    if (!draft) return;
    const formattedLink = formatGithubRawUrl(draft.downloadlink);

    setEdits((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], downloadlink: formattedLink, saving: true },
    }));

    try {
      const res = await authFetch("/api/admin/works", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          visibility: draft.visibility,
          downloadlink: draft.downloadlink,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update work");
      }

      // Update topic in local array
      setTopics((prevTopics) =>
        prevTopics.map((t) =>
          t._id === topicId
            ? { ...t, visibility: draft.visibility, downloadlink: draft.downloadlink }
            : t
        )
      );

      setEdits((prev) => ({
        ...prev,
        [topicId]: {
          ...prev[topicId],
          saving: false,
          successMsg: true,
        },
      }));

      setTimeout(() => {
        setEdits((prev) => ({
          ...prev,
          [topicId]: { ...prev[topicId], successMsg: false },
        }));
      }, 2500);
    } catch (err) {
      console.error("Failed to save work settings:", err);
      alert(err.message || "Failed to update work settings");
      setEdits((prev) => ({
        ...prev,
        [topicId]: { ...prev[topicId], saving: false },
      }));
    }
  };

  return (
    <div className="aw-container">
      {/* Header */}
      <div className="aw-header">
        <div className="aw-title-wrap">
          <div className="aw-icon-badge">
            <FiFileText size={24} />
          </div>
          <div>
            <h1 className="aw-title">Works Settings & Moderation</h1>
            <p className="aw-subtitle">
              Manage work visibility (Public, Private, Unlisted) and custom external Download Links for all works.
            </p>
          </div>
        </div>

        <div className="aw-stats-bar">
          <div className="aw-stat-pill">
            Total Records: <strong>{totalRecords}</strong>
          </div>
          <div className="aw-stat-pill">
            Page: <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="aw-loading">Loading works records...</div>
      ) : topics.length === 0 ? (
        <div className="aw-empty">No work records found.</div>
      ) : (
        <div className="aw-grid">
          {topics.map((topic) => {
            const draft = edits[topic._id] || {
              visibility: topic.visibility || "public",
              downloadlink: topic.downloadlink || "",
              saving: false,
              successMsg: false,
            };

            const images = Array.isArray(topic.images) ? topic.images.slice(0, 2) : [];

            return (
              <div key={topic._id} className="aw-card">
                <div className="aw-card-main">
                  <div className="aw-card-info">
                    <h3 className="aw-card-title">{topic.topic || "Untitled Work"}</h3>
                    <div className="aw-card-meta">
                      {topic.subject && (
                        <span className="aw-meta-chip">Subject: {topic.subject}</span>
                      )}
                      {topic.userName && (
                        <span className="aw-meta-chip">
                          Author: {topic.userName} {topic.usn ? `(${topic.usn})` : ""}
                        </span>
                      )}
                      <span className="aw-meta-chip">
                        Date: {new Date(topic.timestamp).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/works/${topic._id}`}
                        target="_blank"
                        className="aw-meta-chip"
                        style={{ color: "#4f46e5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <FiExternalLink size={12} /> View Work
                      </Link>
                    </div>

                    {images.length > 0 && (
                      <div className="aw-card-previews">
                        {images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Preview ${i + 1}`}
                            className="aw-preview-img"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin settings controls */}
                <div className="aw-card-controls">
                  <div className="aw-control-group">
                    <label className="aw-control-label">Visibility</label>
                    <select
                      value={draft.visibility}
                      onChange={(e) => handleVisibilityChange(topic._id, e.target.value)}
                      className={`aw-select aw-select-${draft.visibility}`}
                    >
                      <option value="public">🌐 Public</option>
                      <option value="unlisted">🔗 Unlisted</option>
                      <option value="private">🔒 Private</option>
                    </select>
                  </div>

                  <div className="aw-control-group">
                    <label className="aw-control-label">Download Link (External URL)</label>
                    <div className="aw-input-wrap">
                      <FiLink className="aw-input-icon" size={16} />
                      <input
                        type="url"
                        placeholder="e.g. https://drive.google.com/... (optional)"
                        value={draft.downloadlink}
                        onChange={(e) => handleDownloadLinkChange(topic._id, e.target.value)}
                        className="aw-input"
                      />
                    </div>
                  </div>

                  <div className="aw-control-group" style={{ justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleSave(topic._id)}
                      disabled={draft.saving}
                      className="aw-save-btn"
                    >
                      {draft.saving ? (
                        "Saving..."
                      ) : draft.successMsg ? (
                        <>
                          <FiCheck size={16} /> Saved!
                        </>
                      ) : (
                        <>
                          <FiSave size={16} /> Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="aw-pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="aw-page-btn"
          >
            <FiChevronLeft size={18} /> Previous
          </button>
          <span className="aw-page-info">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="aw-page-btn"
          >
            Next <FiChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
