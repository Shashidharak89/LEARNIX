"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBook,
  FiPlus,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiLock,
  FiUnlock,
  FiShare2
} from "react-icons/fi";
import TopicCard from "./TopicCard";
import axios from "axios";
export default function SubjectsGrid({ 
  subjects, 
  allUsers, 
  usn, 
  isLoading, 
  onAddTopic, 
  onSubjectDelete, 
  onTopicDelete, 
  onRefreshSubjects,
  showMessage 
}) {
  const router = useRouter();
  const [topicName, setTopicName] = useState("");
  const [togglingSubject, setTogglingSubject] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());
  const [topicsBySubject, setTopicsBySubject] = useState({});

  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, subjectId: null, subjectName: "" });
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const [renameModal, setRenameModal] = useState({ open: false, subjectId: null, currentName: "" });
  const [renameValue, setRenameValue] = useState("");
  const [renamingSubjectId, setRenamingSubjectId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuFor(null);
      }
    };

    if (openMenuFor) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuFor]);

  const getAllTopicsForSubject = (subjectName) => {
    const topicSet = new Set();
    allUsers.forEach(user => {
      if (user.subjects && Array.isArray(user.subjects)) {
        user.subjects.forEach(subjectObj => {
          if (subjectObj.subject === subjectName && subjectObj.topics && Array.isArray(subjectObj.topics)) {
            subjectObj.topics.forEach(topicObj => {
              if (topicObj.topic && topicObj.topic.trim()) {
                topicSet.add(topicObj.topic.trim());
              }
            });
          }
        });
      }
    });
    return Array.from(topicSet).sort();
  };

  const handleTopicSelectForSubject = (e) => {
    setTopicName(e.target.value);
  };

  const handleAddTopicWithReset = async (subjectId, subjectName) => {
    await onAddTopic(subjectName, topicName, true);
    setTopicName("");
    if (subjectId) {
      // reload first page of topics for this subject
      fetchTopicsForSubject(subjectId, 1);
    }
  };

  const fetchTopicsForSubject = async (subjectId, page = 1, limit = 10) => {
    if (!subjectId) return;
    setTopicsBySubject((prev) => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        loading: true
      }
    }));

    try {
      const url = `/api/topic/by-subject?subjectId=${encodeURIComponent(subjectId)}&page=${page}&limit=${limit}`;
      const headers = {};
      if (usn) headers['x-usn'] = usn;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to fetch topics', data);
        setTopicsBySubject((prev) => ({
          ...prev,
          [subjectId]: {
            ...(prev[subjectId] || {}),
            loading: false
          }
        }));
        return;
      }

      const received = data.topics || [];
      const paging = data.paging || { page: 1, limit, total: received.length, returned: received.length };

      setTopicsBySubject((prev) => {
        const prevTopics = page === 1 ? [] : (prev[subjectId]?.topics || []);
        const combined = [...prevTopics, ...received];
        const hasMore = paging.limit > 0 ? combined.length < (paging.total || 0) : false;
        return {
          ...prev,
          [subjectId]: {
            topics: combined,
            page: paging.page,
            limit: paging.limit,
            total: paging.total,
            returned: paging.returned,
            hasMore,
            loading: false
          }
        };
      });
    } catch (err) {
      console.error(err);
      setTopicsBySubject((prev) => ({
        ...prev,
        [subjectId]: {
          ...(prev[subjectId] || {}),
          loading: false
        }
      }));
    }
  };

  const toggleSubjectPublic = async (subjectId, currentValue) => {
    setTogglingSubject(subjectId);
    try {
      await axios.put("/api/subject/public", {
        usn,
        subjectId,
        public: !currentValue
      });
      await onRefreshSubjects();
      showMessage(
        `Subject ${!currentValue ? 'enabled' : 'disabled'} successfully!`, 
        "success"
      );
    } catch (err) {
      console.error(err);
      showMessage("Failed to update subject status", "error");
    } finally {
      setTogglingSubject(null);
    }
  };

  const toggleExpand = (subjectId) => {
    const s = new Set([...expandedSubjects]);
    if (s.has(subjectId)) s.delete(subjectId);
    else s.add(subjectId);
    setExpandedSubjects(s);
    if (s.has(subjectId)) {
      const current = topicsBySubject[subjectId];
      if (!current || !(current.topics && current.topics.length)) {
        fetchTopicsForSubject(subjectId, 1, 10);
      }
    }
  };

  const requestDeleteSubject = (subjectId, subjectName) => {
    setOpenMenuFor(null);
    setDeleteConfirm({ open: true, subjectId, subjectName });
  };

  const handleOpenSubject = (subjectId) => {
    setOpenMenuFor(null);
    if (!subjectId) return;
    router.push(`/works/subject/${subjectId}`);
  };

  const requestRenameSubject = (subjectId, currentName) => {
    setOpenMenuFor(null);
    setRenameValue(currentName || "");
    setRenameModal({ open: true, subjectId, currentName: currentName || "" });
  };

  const cancelRenameSubject = () => {
    if (renamingSubjectId) return;
    setRenameModal({ open: false, subjectId: null, currentName: "" });
    setRenameValue("");
  };

  const confirmRenameSubject = async () => {
    const { subjectId, currentName } = renameModal;
    const nextName = String(renameValue || "").trim();
    if (!subjectId) return;
    if (!nextName) {
      showMessage("Please enter a subject name", "error");
      return;
    }
    if (nextName.toLowerCase() === String(currentName || "").trim().toLowerCase()) {
      cancelRenameSubject();
      return;
    }

    setRenamingSubjectId(subjectId);
    try {
      const res = await fetch("/api/subject/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, subjectId, newSubject: nextName })
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to rename subject", "error");
        return;
      }

      // keep UI in sync
      await onRefreshSubjects();
      showMessage("Subject renamed successfully!", "success");
      cancelRenameSubject();
    } catch (err) {
      console.error(err);
      showMessage("Error renaming subject", "error");
    } finally {
      setRenamingSubjectId(null);
    }
  };

  const cancelDeleteSubject = () => {
    if (deletingSubjectId) return;
    setDeleteConfirm({ open: false, subjectId: null, subjectName: "" });
  };

  const confirmDeleteSubject = async () => {
    const { subjectId, subjectName } = deleteConfirm;
    if (!subjectName || !usn) return;

    setDeletingSubjectId(subjectId || subjectName);
    try {
      const res = await fetch("/api/subject/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, subject: subjectName })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to delete subject", "error");
        return;
      }

      if (onSubjectDelete) onSubjectDelete(data.subjects);
      showMessage("Subject deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Error deleting subject", "error");
    } finally {
      setDeletingSubjectId(null);
      setDeleteConfirm({ open: false, subjectId: null, subjectName: "" });
    }
  };

  const handleShareSubject = (subjectId) => {
    setOpenMenuFor(null);
    const shareUrl = `${window.location.origin}/works/subject/${subjectId}`;
    
    if (navigator.share) {
      navigator.share({
        title: "Check out this subject!",
        text: "View this subject and its topics",
        url: shareUrl
      }).catch((err) => console.log("Share cancelled:", err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => showMessage("Subject share link copied to clipboard!", "success"))
        .catch(() => showMessage("Failed to copy link", "error"));
    }
  };

  // Inline style helpers (kept simple, following your theme)
  const cardStyle = {
    background: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    boxShadow: "0 6px 18px rgba(14,165,233,0.06)",
    border: "1px solid rgba(14,165,233,0.06)"
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer"
  };

  const leftHeaderStyle = { display: "flex", alignItems: "center", gap: 10 };

  const subjectTitleStyle = { fontWeight: 700, fontSize: 16, margin: 0 };

  const addTopicSectionStyle = { marginTop: 10, display: "flex", gap: 8, alignItems: "center" };

  const inputSmallStyle = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(15,23,42,0.06)",
    minWidth: 160
  };

  const btnStyle = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(90deg,#0ea5e9,#60a5fa)",
    color: "#fff",
    fontWeight: 700,
    display: "inline-flex",
    gap: 6,
    alignItems: "center"
  };

  const topicsContainerStyle = { marginTop: 12 };

  const emptyTopicsStyle = { display: "flex", gap: 8, alignItems: "center", color: "#64748b" };

  return (
    <div className="mse-subjects-grid">
      {deleteConfirm.open && (
        <div className="mse-options-modal-overlay" onClick={cancelDeleteSubject}>
          <div className="mse-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mse-options-modal-icon">
              <FiTrash2 />
            </div>
            <h4>Delete subject?</h4>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.subjectName}</strong>? This can’t be undone.
            </p>
            <div className="mse-options-modal-actions">
              <button className="mse-options-cancel" onClick={cancelDeleteSubject} disabled={!!deletingSubjectId}>
                Cancel
              </button>
              <button className="mse-options-delete" onClick={confirmDeleteSubject} disabled={!!deletingSubjectId}>
                {deletingSubjectId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameModal.open && (
        <div className="mse-options-modal-overlay" onClick={cancelRenameSubject}>
          <div className="mse-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mse-options-modal-icon mse-options-modal-icon-edit">
              <FiEdit2 />
            </div>
            <h4>Rename subject</h4>
            <p>Enter a new name for <strong>{renameModal.currentName}</strong>.</p>

            <div className="mse-options-input-wrap">
              <input
                className="mse-options-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="New subject name"
                autoFocus
                disabled={!!renamingSubjectId}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRenameSubject();
                  if (e.key === "Escape") cancelRenameSubject();
                }}
              />
            </div>

            <div className="mse-options-modal-actions">
              <button className="mse-options-cancel" onClick={cancelRenameSubject} disabled={!!renamingSubjectId}>
                Cancel
              </button>
              <button className="mse-options-save" onClick={confirmRenameSubject} disabled={!!renamingSubjectId}>
                {renamingSubjectId ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {subjects.map((sub, idx) => {
        const subjectKey = sub._id ?? `${idx}-${sub.subject}`;
        const topicsForThisSubject = getAllTopicsForSubject(sub.subject);
        const paged = topicsBySubject[subjectKey] || { topics: [], loading: false, page: 0, hasMore: false };
        const subjectPublic = sub.public !== undefined ? sub.public : true;
        const isToggling = togglingSubject === sub._id;
        const isExpanded = expandedSubjects.has(subjectKey);

        return (
          <div key={idx} style={cardStyle}>
            <div
              style={headerStyle}
              // clicking header toggles expand/collapse
              onClick={() => toggleExpand(subjectKey)}
              role="button"
              aria-expanded={isExpanded}
            >
              <div style={leftHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FiBook style={{ color: "#0ea5e9" }} />
                  <h3 style={subjectTitleStyle}>{sub.subject}</h3>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  className={`mse-visibility-badge ${subjectPublic ? "is-public" : "is-private"}`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  role="status"
                  aria-label={`Subject visibility: ${subjectPublic ? "Public" : "Private"}`}
                >
                  {subjectPublic ? "Public" : "Private"}
                </span>
                <div className="mse-subject-options" ref={openMenuFor === sub._id ? menuRef : null}>
                  <button
                    className="mse-options-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuFor((prev) => (prev === sub._id ? null : sub._id));
                    }}
                    aria-label="More options"
                    aria-expanded={openMenuFor === sub._id}
                  >
                    <FiMoreVertical />
                  </button>

                  {openMenuFor === sub._id && (
                    <div className="mse-options-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mse-options-item"
                        onClick={() => handleOpenSubject(sub._id)}
                      >
                        <FiFileText className="mse-options-icon" />
                        <span>Open</span>
                      </button>

                      <button
                        className="mse-options-item"
                        onClick={() => requestRenameSubject(sub._id, sub.subject)}
                      >
                        <FiEdit2 className="mse-options-icon" />
                        <span>Edit (Rename)</span>
                      </button>

                      <button
                        className="mse-options-item"
                        onClick={() => handleShareSubject(sub._id)}
                      >
                        <FiShare2 className="mse-options-icon" />
                        <span>Share Subject</span>
                      </button>

                      <button
                        className="mse-options-item"
                        onClick={() => toggleSubjectPublic(sub._id, subjectPublic)}
                        disabled={isToggling}
                      >
                        {subjectPublic ? <FiLock className="mse-options-icon" /> : <FiUnlock className="mse-options-icon" />}
                        <span>
                          {isToggling
                            ? "Processing..."
                            : subjectPublic
                              ? "Public → Private"
                              : "Private → Public"}
                        </span>
                      </button>

                      <button
                        className="mse-options-item mse-options-danger"
                        onClick={() => requestDeleteSubject(sub._id, sub.subject)}
                      >
                        <FiTrash2 className="mse-options-icon" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded area: add-topic + topics list (only rendered when expanded) */}
            {isExpanded && (
              <div style={{ marginTop: 10 }}>
                {/* Add Topic Input */}
                <div style={addTopicSectionStyle}>
                  <select
                    value=""
                    onChange={handleTopicSelectForSubject}
                    style={inputSmallStyle}
                    disabled={isLoading}
                  >
                    <option value="">Select existing topic for {sub.subject}</option>
                    {topicsForThisSubject.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder={`Or enter new topic name...`}
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    style={inputSmallStyle}
                    disabled={isLoading}
                  />

                  <button 
                    onClick={() => handleAddTopicWithReset(subjectKey, sub.subject)} 
                    style={{ ...btnStyle, padding: "8px 12px" }}
                    disabled={isLoading || !topicName.trim()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <FiPlus />
                    <span style={{ fontSize: 13 }}>Add Topic</span>
                  </button>
                </div>

                {/* Topics List */}
                <div style={topicsContainerStyle}>
                  {paged.loading ? (
                    <div style={emptyTopicsStyle}>Loading topics...</div>
                  ) : (!paged.topics || paged.topics.length === 0) ? (
                    <div style={emptyTopicsStyle}>
                      <FiFileText />
                      <span>No topics yet</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {paged.topics.map((topicObj, tIdx) => (
                        <TopicCard
                          key={topicObj._id || `${tIdx}-${topicObj.topic || topicObj}`}
                          subject={sub.subject}
                          topic={topicObj}
                          usn={usn}
                          isLoading={isLoading}
                          onTopicDelete={onTopicDelete}
                          onRefreshSubjects={onRefreshSubjects}
                          showMessage={showMessage}
                        />
                      ))}

                      {paged.hasMore && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            onClick={() => fetchTopicsForSubject(subjectKey, (paged.page || 1) + 1, paged.limit || 10)}
                            style={{ ...btnStyle, padding: "6px 10px" }}
                            disabled={paged.loading}
                          >
                            View more topics
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
