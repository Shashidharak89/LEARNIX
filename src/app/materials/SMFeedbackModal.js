"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon, CircleCheckIcon, SendIcon, TriangleAlertIcon, XIcon } from "@animateicons/react/lucide";
import "./SMFeedbackModal.css";

const ISSUE_OPTIONS = [
  "Facing an issue downloading a file",
  "File is missing or will not open",
  "Incorrect or outdated study material",
  "Folder or subject is difficult to find",
  "Search is not showing the right results",
  "Pinned folders are not working",
  "External resource or link is broken",
  "Page is slow or not displaying correctly",
  "Other Study Materials issue",
];

export default function SMFeedbackModal({
  open,
  onClose,
  pageName = "study_material",
  pageLabel = "Study material",
  issueOptions = ISSUE_OPTIONS,
  description = "Tell us what went wrong in the directory. Your note helps us keep materials easy to find.",
}) {
  const [feedback, setFeedback] = useState("");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [issueQuery, setIssueQuery] = useState("");
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const closeRef = useRef(null);
  const sendRef = useRef(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const issueSearchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !sending) {
        if (issuesOpen) setIssuesOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, sending, issuesOpen]);

  useEffect(() => {
    if (!issuesOpen) return undefined;
    const updateMenuPosition = () => {
      const trigger = dropdownRef.current?.querySelector(".sm-issue-trigger");
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const gap = 6;
      const height = Math.min(280, window.innerHeight - margin * 2);
      const below = window.innerHeight - rect.bottom - margin;
      const above = rect.top - margin;
      const openAbove = below < Math.min(200, height) && above > below;
      const maxHeight = Math.max(120, Math.min(height, (openAbove ? above : below) - gap));
      const width = Math.min(rect.width, window.innerWidth - margin * 2);
      setMenuPosition({
        position: "fixed",
        top: openAbove ? Math.max(margin, rect.top - maxHeight - gap) : rect.bottom + gap,
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
        width,
        maxHeight,
        zIndex: 1300,
      });
    };
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    const timer = window.setTimeout(() => issueSearchRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [issuesOpen]);

  useEffect(() => {
    if (!issuesOpen) return undefined;
    const onPointerDown = (event) => {
      if (dropdownRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setIssuesOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIssuesOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [issuesOpen]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = feedback.trim();
    const issueSummary = selectedIssues.join("; ");
    const reportBody = [issueSummary, message].filter(Boolean).join("\n\n");
    if (!reportBody || sending) return;

    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: `(${pageLabel}) ${reportBody}`, pageName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your report.");
      setStatus("success");
      setFeedback("");
      setSelectedIssues([]);
      setIssueQuery("");
    } catch (error) {
      setStatus(error.message || "Could not send your report. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sm-feedback-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sm-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="sm-feedback-title">
        <button ref={closeRef} type="button" className="sm-feedback-close" onClick={onClose} aria-label="Close feedback form">
          <XIcon size={18} />
        </button>
        <div className="sm-feedback-mark"><TriangleAlertIcon size={22} aria-hidden="true" /></div>
        <p className="sm-feedback-eyebrow">{pageLabel.toUpperCase()}</p>
        <h2 id="sm-feedback-title">Report a problem</h2>
        <p className="sm-feedback-description">{description}</p>

        {status === "success" ? (
          <div className="sm-feedback-success" role="status">
            <CircleCheckIcon size={21} aria-hidden="true" />
            <div><strong>Report sent</strong><span>Thanks for helping us improve Study Materials.</span></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sm-feedback-form">
            <label id="sm-feedback-issues-label">What are you having trouble with?</label>
            <div className="sm-issue-dropdown qp-custom-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`sm-issue-trigger qp-dropdown-trigger ${issuesOpen ? "is-open" : ""}`}
                onClick={() => setIssuesOpen((value) => !value)}
                aria-haspopup="listbox"
                aria-expanded={issuesOpen}
                aria-labelledby="sm-feedback-issues-label"
              >
                <span className={`qp-dropdown-trigger__text ${selectedIssues.length ? "" : "is-placeholder"}`}>
                  {selectedIssues.length ? `${selectedIssues.length} issue${selectedIssues.length === 1 ? "" : "s"} selected` : "Select one or more issues"}
                </span>
                <span className="qp-dropdown-trigger__actions">
                  {selectedIssues.length > 0 && <span className="sm-issue-count">{selectedIssues.length}</span>}
                  <ChevronDownIcon size={17} className="qp-dropdown-chevron" aria-hidden="true" />
                </span>
              </button>
              {selectedIssues.length > 0 && (
                <div className="sm-issue-chips" aria-label="Selected issues">
                  {selectedIssues.map((issue) => (
                    <button key={issue} type="button" className="sm-issue-chip" onClick={() => setSelectedIssues((items) => items.filter((item) => item !== issue))} aria-label={`Remove ${issue}`}>
                      {issue}<XIcon size={13} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
              {issuesOpen && menuPosition && typeof document !== "undefined" && createPortal(
                <div ref={menuRef} className="qp-dropdown-menu sm-pref-portal-menu sm-issue-menu" style={menuPosition} role="listbox" aria-multiselectable="true" aria-label="Study Materials issues">
                  <div className="qp-dropdown-search-wrap">
                    <input
                      ref={issueSearchRef}
                      className="qp-dropdown-search-input"
                      type="search"
                      value={issueQuery}
                      onChange={(event) => setIssueQuery(event.target.value)}
                      onKeyDown={(event) => event.stopPropagation()}
                      placeholder="Search issues…"
                      aria-label="Search Study Materials issues"
                    />
                    {issueQuery && <button type="button" className="qp-dropdown-search-clear" onClick={() => setIssueQuery("")} aria-label="Clear issue search"><XIcon size={14} aria-hidden="true" /></button>}
                  </div>
                  {issueOptions.filter((issue) => issue.toLowerCase().includes(issueQuery.trim().toLowerCase())).length === 0 ? (
                    <div className="qp-dropdown-empty">No matching issues</div>
                  ) : issueOptions.filter((issue) => issue.toLowerCase().includes(issueQuery.trim().toLowerCase())).map((issue) => {
                    const selected = selectedIssues.includes(issue);
                    return (
                      <button
                        key={issue}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`qp-dropdown-item sm-issue-option ${selected ? "is-selected" : ""}`}
                        onClick={() => setSelectedIssues((items) => selected ? items.filter((item) => item !== issue) : [...items, issue])}
                      >
                        {issue}
                        <span className={`sm-issue-checkbox ${selected ? "is-checked" : ""}`} aria-hidden="true">{selected && <CheckIcon size={13} />}</span>
                      </button>
                    );
                  })}
                </div>,
                document.body,
              )}
            </div>
            <label htmlFor="sm-feedback-message">What should we know?</label>
            <textarea
              id="sm-feedback-message"
              value={feedback}
              onChange={(event) => { setFeedback(event.target.value); setStatus(""); }}
              placeholder="Describe the issue or share an idea…"
              rows={5}
              maxLength={3000}
            />
            <div className="sm-feedback-form-footer">
              <span>{feedback.length}/3000</span>
              <button
                ref={sendRef}
                type="submit"
                disabled={(!feedback.trim() && selectedIssues.length === 0) || sending}
                onMouseEnter={() => sendRef.current?.querySelector("svg")?.startAnimation?.()}
                onMouseLeave={() => sendRef.current?.querySelector("svg")?.stopAnimation?.()}
              >
                <SendIcon size={16} aria-hidden="true" />
                {sending ? "Sending…" : "Send report"}
              </button>
            </div>
            {status && <p className="sm-feedback-error" role="alert">{status}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
