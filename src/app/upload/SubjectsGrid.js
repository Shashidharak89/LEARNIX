"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiBook,
  FiPlus,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiMoreVertical,
  FiTrash2,
  FiLock,
  FiUnlock
} from "react-icons/fi";
import TopicCard from "./TopicCard";
import axios from "axios";

/*
  Minimal change: subjects are collapsed by default (show header only).
  Click subject header toggles expansion to show add-topic inputs + topics list.
  Uses inline styles only; no external CSS changes required.
*/

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
  const [topicName, setTopicName] = useState("");
  const [togglingSubject, setTogglingSubject] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, subjectId: null, subjectName: "" });
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
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

  const handleAddTopicWithReset = async (subject) => {
    await onAddTopic(subject, topicName, true);
    setTopicName("");
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
  };

  const requestDeleteSubject = (subjectId, subjectName) => {
    setOpenMenuFor(null);
    setDeleteConfirm({ open: true, subjectId, subjectName });
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

      {subjects.map((sub, idx) => {
        const topicsForThisSubject = getAllTopicsForSubject(sub.subject);
        const subjectPublic = sub.public !== undefined ? sub.public : true;
        const isToggling = togglingSubject === sub._id;
        const isExpanded = expandedSubjects.has(sub._id ?? `${idx}-${sub.subject}`);

        return (
          <div key={idx} style={cardStyle}>
            <div
              style={headerStyle}
              // clicking header toggles expand/collapse
              onClick={() => toggleExpand(sub._id ?? `${idx}-${sub.subject}`)}
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
                    onClick={() => handleAddTopicWithReset(sub.subject)} 
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
                  {!sub.topics || sub.topics.length === 0 ? (
                    <div style={emptyTopicsStyle}>
                      <FiFileText />
                      <span>No topics yet</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sub.topics.map((topic, tIdx) => (
                        <TopicCard
                          key={tIdx}
                          subject={sub.subject}
                          topic={topic}
                          usn={usn}
                          isLoading={isLoading}
                          onTopicDelete={onTopicDelete}
                          onRefreshSubjects={onRefreshSubjects}
                          showMessage={showMessage}
                        />
                      ))}
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
