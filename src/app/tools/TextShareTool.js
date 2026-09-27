// app/tools/TextShareTool.jsx
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  FiCopy, FiSend, FiCode, FiShare2, FiEdit3, FiRefreshCw, FiSave,
  FiLock, FiUnlock, FiList, FiTrash2, FiChevronDown, FiChevronUp,
  FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiMaximize, FiMinimize,
  FiMessageSquare
} from "react-icons/fi";
import "./styles/TextShare.css";
import "./styles/ToolsPage.css";

const STORAGE_KEY = "textshare_codes";

export default function TextShareTool({ forceExpandTrigger }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (forceExpandTrigger) {
      setIsExpanded(true);
    }
  }, [forceExpandTrigger]);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [editAccess, setEditAccess] = useState(false);
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedText, setFetchedText] = useState("");
  const [fetchedEditAccess, setFetchedEditAccess] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [myCodes, setMyCodes] = useState([]);
  const [showMyCodes, setShowMyCodes] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(null);
  const [deletingCode, setDeletingCode] = useState(null);
  const [showCustomCodeModal, setShowCustomCodeModal] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [customCodeAvailable, setCustomCodeAvailable] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [publishingCustom, setPublishingCustom] = useState(false);

  const textareaRef = useRef(null);
  const fetchedTextareaRef = useRef(null);
  const fullscreenTextareaRef = useRef(null);

  // ── Storage ────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMyCodes(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  // ── Toast ──────────────────────────────────────────
  const showToast = useCallback((message, type = "info") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  const getToastIcon = (type) => {
    if (type === "success") return <FiCheckCircle />;
    if (type === "error")   return <FiAlertCircle />;
    return <FiInfo />;
  };

  // ── localStorage helpers ──────────────────────────
  const saveToStorage = useCallback((codes) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(codes)); } catch {}
  }, []);

  const addCodeToStorage = useCallback((newCode, hasEdit) => {
    const entry = { code: newCode, editAccess: hasEdit, createdAt: new Date().toISOString() };
    const updated = [entry, ...myCodes];
    setMyCodes(updated);
    saveToStorage(updated);
  }, [myCodes, saveToStorage]);

  const removeCodeFromStorage = useCallback((c) => {
    const updated = myCodes.filter(x => x.code !== c);
    setMyCodes(updated);
    saveToStorage(updated);
  }, [myCodes, saveToStorage]);

  const updateCodeInStorage = useCallback((c, newAccess) => {
    const updated = myCodes.map(x => x.code === c ? { ...x, editAccess: newAccess } : x);
    setMyCodes(updated);
    saveToStorage(updated);
  }, [myCodes, saveToStorage]);

  const handleCopy = (t) => {
    navigator.clipboard.writeText(t);
    showToast("Copied to clipboard!", "success");
  };

  function formatTimeAgo(dateString) {
    const diff = Date.now() - new Date(dateString).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return new Date(dateString).toLocaleDateString();
  }

  // ── API actions ────────────────────────────────────
  async function handleGenerate() {
    setCode("");
    if (!text.trim()) { showToast("Please enter some text.", "error"); return; }
    try {
      showToast("Generating code…", "info");
      const res = await fetch("/api/textshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, editAccess }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); return; }
      setCode(data.code);
      addCodeToStorage(data.code, editAccess);
      showToast(`Code generated! ${editAccess ? "Editable." : "View-only."}`, "success");
    } catch { showToast("Network error.", "error"); }
  }

  async function handleFetch(codeToFetch) {
    const target = (codeToFetch || fetchCode).trim();
    setFetchedText(""); setEditedText(""); setIsEditing(false); setFetchedEditAccess(false);
    if (!target) { showToast("Enter a code.", "error"); return; }
    try {
      showToast("Fetching…", "info");
      const res = await fetch(`/api/textshare?code=${target}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Not found.", "error"); return; }
      setFetchedText(data.text);
      setEditedText(data.text);
      setFetchedEditAccess(data.editAccess || false);
      setCurrentCode(target);
      showToast(`Retrieved! ${data.editAccess ? "(Editable)" : "(Read-only)"}`, "success");
    } catch { showToast("Network error.", "error"); }
  }

  async function handleFetchInline() {
    if (!fetchCode.trim()) { showToast("Enter a code.", "error"); return; }
    setIsExpanded(true);
    await handleFetch(fetchCode.trim());
  }

  async function handleRefresh() {
    if (!currentCode) return;
    setRefreshing(true);
    showToast("Refreshing…", "info");
    try {
      const res = await fetch(`/api/textshare?code=${currentCode}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); setRefreshing(false); return; }
      setFetchedText(data.text); setEditedText(data.text); setFetchedEditAccess(data.editAccess || false);
      showToast("Refreshed!", "success");
    } catch { showToast("Network error.", "error"); }
    setRefreshing(false);
  }

  async function handleSaveEdit() {
    if (!currentCode || !editedText.trim()) { showToast("Cannot save empty text.", "error"); return; }
    setSaving(true);
    showToast("Saving…", "info");
    try {
      const res = await fetch("/api/textshare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, text: editedText }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); setSaving(false); return; }
      setFetchedText(data.text);
      showToast("Saved!", "success");
    } catch { showToast("Network error.", "error"); }
    setSaving(false);
  }

  function handleCancelEdit() {
    setEditedText(fetchedText); setIsEditing(false);
    showToast("Edit cancelled.", "info");
  }

  function openCustomCodeModal() {
    if (!text.trim()) { showToast("Enter text first.", "error"); return; }
    setCustomCodeInput(""); setCustomCodeAvailable(null); setShowCustomCodeModal(true);
  }

  function closeCustomCodeModal() {
    setShowCustomCodeModal(false); setCustomCodeInput(""); setCustomCodeAvailable(null);
  }

  async function checkCodeAvailability() {
    const clean = customCodeInput.toLowerCase().trim();
    if (!clean) { showToast("Enter a code.", "error"); return; }
    if (clean.length < 3) { showToast("At least 3 characters.", "error"); return; }
    if (!/^[a-z0-9]+$/.test(clean)) { showToast("Lowercase letters & numbers only.", "error"); return; }
    setCheckingAvailability(true);
    try {
      const res = await fetch("/api/textshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customCode: clean, checkOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); setCustomCodeAvailable(null); }
      else {
        setCustomCodeAvailable(data.available);
        showToast(data.available ? `"${clean}" is available!` : `"${clean}" is taken.`, data.available ? "success" : "error");
      }
    } catch { showToast("Network error.", "error"); setCustomCodeAvailable(null); }
    setCheckingAvailability(false);
  }

  async function publishWithCustomCode() {
    if (!customCodeAvailable) return;
    const clean = customCodeInput.toLowerCase().trim();
    setPublishingCustom(true);
    showToast("Publishing…", "info");
    try {
      const res = await fetch("/api/textshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, editAccess, customCode: clean }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); setPublishingCustom(false); return; }
      setCode(data.code);
      addCodeToStorage(data.code, editAccess);
      closeCustomCodeModal();
      showToast(`Published as "${data.code}"!`, "success");
    } catch { showToast("Network error.", "error"); }
    setPublishingCustom(false);
  }

  async function handleToggleAccess(c, current) {
    setTogglingAccess(c);
    showToast("Updating…", "info");
    try {
      const res = await fetch("/api/textshare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, editAccess: !current, updateAccessOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); setTogglingAccess(null); return; }
      updateCodeInStorage(c, !current);
      showToast(`Access ${!current ? "enabled" : "disabled"} for ${c}`, "success");
    } catch { showToast("Network error.", "error"); }
    setTogglingAccess(null);
  }

  async function handleDeleteCode(c) {
    if (!window.confirm(`Delete code "${c}"?`)) return;
    setDeletingCode(c);
    showToast("Deleting…", "info");
    try {
      const res = await fetch(`/api/textshare?code=${c}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed.", "error"); setDeletingCode(null); return; }
      removeCodeFromStorage(c);
      if (currentCode === c) { setFetchedText(""); setEditedText(""); setCurrentCode(""); setFetchCode(""); }
      if (code === c) setCode("");
      showToast("Deleted!", "success");
    } catch { showToast("Network error.", "error"); }
    setDeletingCode(null);
  }

  // ── Keyboard shortcuts for fullscreen ─────────────
  useEffect(() => {
    if (!isFullScreen) return;
    const onKey = (e) => {
      // Ctrl+S / Cmd+S — Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        if (fetchedEditAccess && isEditing) handleSaveEdit();
      }
      // Ctrl+Shift+C — Copy all
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        handleCopy(isEditing ? editedText : fetchedText);
      }
      // Ctrl+B — Cancel edit
      if ((e.ctrlKey || e.metaKey) && e.key === "b" && !e.shiftKey) {
        e.preventDefault();
        if (fetchedEditAccess && isEditing) handleCancelEdit();
      }
      // Ctrl+R — Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleRefresh();
      }
      // Escape — Exit fullscreen
      if (e.key === "Escape") {
        e.preventDefault();
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullScreen, fetchedEditAccess, isEditing, editedText, fetchedText]);

  // ── Fullscreen view (no Navbar — rendered outside page layout) ──
  if (isFullScreen) {
    return (
      <div className="tst-fullscreen-container">
        {toast && (
          <div className={`tool-toast tool-toast-${toast.type}`}>
            <span className="tool-toast-icon">{getToastIcon(toast.type)}</span>
            <span>{toast.message}</span>
            <button className="tool-toast-close" onClick={dismissToast}><FiX /></button>
          </div>
        )}

        <div className="tst-fullscreen-header">
          <div className="tst-fullscreen-header-left">
            <FiMessageSquare style={{ color: "var(--tst-yellow-dark)" }} size={18} />
            <span>Text Sharing</span>
            {currentCode && (
              <code style={{ background: "rgba(242,194,0,0.12)", color: "var(--tst-yellow-dark)", borderRadius: 8, padding: "2px 10px", fontSize: "0.85rem", fontWeight: 700 }}>
                {currentCode}
              </code>
            )}
            <span className={`tool-access-badge ${fetchedEditAccess ? "tool-badge-editable" : "tool-badge-readonly"}`} style={{ fontSize: "0.72rem" }}>
              {fetchedEditAccess ? <><FiUnlock size={10} /> Editable</> : <><FiLock size={10} /> Read-only</>}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {fetchedEditAccess && (
              isEditing ? (
                <>
                  <button className="tool-btn-pill tool-pill-save" onClick={handleSaveEdit} disabled={saving} title="Ctrl+S">
                    <FiSave size={13} /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button className="tool-btn-pill tool-pill-cancel" onClick={handleCancelEdit} title="Ctrl+B">
                    <FiX size={13} /> Cancel
                  </button>
                </>
              ) : (
                <button className="tool-btn-pill tool-pill-edit" onClick={() => setIsEditing(true)}>
                  <FiEdit3 size={13} /> Edit
                </button>
              )
            )}
            <button className="tool-btn-pill tool-pill-refresh" onClick={handleRefresh} disabled={refreshing} title="Ctrl+R">
              <FiRefreshCw size={13} className={refreshing ? "tst-spin" : ""} />
            </button>
            <button className="tool-btn-pill tool-pill-copy" onClick={() => handleCopy(isEditing ? editedText : fetchedText)} title="Ctrl+Shift+C">
              <FiCopy size={13} /> Copy
            </button>
            <button className="tool-btn-pill tool-pill-minimize" onClick={() => setIsFullScreen(false)} title="Esc">
              <FiMinimize size={13} /> Exit
            </button>
          </div>
        </div>

        {/* Keyboard shortcut hints */}
        <div style={{ padding: "6px 20px", background: "#fffceb", borderBottom: "1px solid rgba(242,194,0,0.2)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            fetchedEditAccess && isEditing && ["Ctrl+S", "Save"],
            fetchedEditAccess && isEditing && ["Ctrl+B", "Cancel"],
            fetchedEditAccess && !isEditing && ["E key", "Edit"],
            ["Ctrl+R", "Refresh"],
            ["Ctrl+⇧+C", "Copy all"],
            ["Esc", "Exit"],
          ].filter(Boolean).map(([k, v]) => (
            <span key={k} style={{ fontSize: "0.73rem", color: "var(--tst-yellow-dark)" }}>
              <kbd style={{ background: "rgba(242,194,0,0.15)", borderRadius: 5, padding: "1px 6px", fontFamily: "monospace", fontWeight: 700 }}>{k}</kbd>{" "}
              <span style={{ color: "var(--tool-gray-500)" }}>{v}</span>
            </span>
          ))}
        </div>

        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <textarea
            ref={fullscreenTextareaRef}
            className={`tool-textarea ${isEditing ? "tool-textarea-editing" : "tool-textarea-readonly"}`}
            style={{ flex: 1, resize: "none", minHeight: "100%", fontSize: "1rem", lineHeight: 1.7 }}
            value={isEditing ? editedText : fetchedText}
            readOnly={!isEditing}
            onChange={e => setEditedText(e.target.value)}
            autoFocus
          />
        </div>
      </div>
    );
  }

  // ── Normal collapsible card ────────────────────────
  return (
    <div className={`tool-card tool-card-tst ${isExpanded ? "tool-card-expanded" : ""}`}>

      {/* Toast */}
      {toast && (
        <div className={`tool-toast tool-toast-${toast.type}`}>
          <span className="tool-toast-icon">{getToastIcon(toast.type)}</span>
          <span>{toast.message}</span>
          <button className="tool-toast-close" onClick={dismissToast}><FiX /></button>
        </div>
      )}

      {/* Custom Code Modal */}
      {showCustomCodeModal && (
        <div className="tst-modal-overlay" onClick={closeCustomCodeModal}>
          <div className="tst-modal" onClick={e => e.stopPropagation()}>
            <div className="tst-modal-header">
              <h3 className="tst-modal-title">Custom Code</h3>
              <button className="tool-btn-pill" onClick={closeCustomCodeModal}><FiX /></button>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", margin: "0 0 14px" }}>
              Choose a memorable code for your text snippet.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                className="tool-text-input"
                style={{ borderColor: "rgba(242,194,0,0.35)" }}
                placeholder="e.g. mycode123"
                value={customCodeInput}
                onChange={e => { setCustomCodeInput(e.target.value.toLowerCase()); setCustomCodeAvailable(null); }}
                maxLength={20}
              />
              <button className="tool-btn tool-btn-ghost" onClick={checkCodeAvailability} disabled={checkingAvailability}>
                {checkingAvailability ? "Checking…" : "Check"}
              </button>
            </div>
            {customCodeAvailable === true && (
              <div style={{ color: "#16a34a", fontSize: "0.82rem", fontWeight: 600, marginBottom: 10 }}>✓ Available!</div>
            )}
            {customCodeAvailable === false && (
              <div style={{ color: "#dc2626", fontSize: "0.82rem", fontWeight: 600, marginBottom: 10 }}>✗ Already taken</div>
            )}
            <button
              style={{ background: "var(--tst-yellow)", color: "#5a3e00", width: "100%", justifyContent: "center" }}
              className="tool-btn"
              onClick={publishWithCustomCode}
              disabled={!customCodeAvailable || publishingCustom}
            >
              <FiSend size={14} /> {publishingCustom ? "Publishing…" : "Publish with this code"}
            </button>
          </div>
        </div>
      )}

      {/* ── Header Row ── */}
      <div
        className="tool-card-header"
        onClick={() => setIsExpanded(v => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsExpanded(v => !v); }
        }}
      >
        <div className="tool-card-header-left">
          <span className="tool-card-toggle-icon">
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </span>
          <div className="tool-card-title-container">
            <h2 className="tool-card-title">Text Sharing</h2>
            <span className="tool-card-subtitle">Share text snippets — or enter a code to fetch</span>
          </div>
        </div>

        {/* Inline fetch field */}
        <div
          className="tool-card-header-inline"
          onClick={e => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Enter code to fetch text"
            value={fetchCode}
            onChange={e => setFetchCode(e.target.value.toLowerCase())}
            className="tool-card-inline-input"
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleFetchInline(); } }}
          />
          <button
            className="tool-card-inline-btn"
            onClick={handleFetchInline}
            disabled={!fetchCode.trim()}
          >
            <FiShare2 size={14} /> Fetch
          </button>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {isExpanded && (
        <div className="tool-card-body">

          {/* ── 1. Fetched text result (shown at top when available) ── */}
          {fetchedText && (
            <div className="tool-inner-section" style={{ borderColor: "rgba(242,194,0,0.3)", background: "rgba(242,194,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <FiMessageSquare style={{ color: "var(--tst-orange-dark)", fontSize: 16 }} />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--tool-gray-900)" }}>
                    Retrieved
                    {currentCode && (
                      <code style={{ marginLeft: 8, background: "rgba(242,194,0,0.15)", color: "var(--tst-yellow-dark)", borderRadius: 7, padding: "1px 8px", fontSize: "0.82rem" }}>
                        {currentCode}
                      </code>
                    )}
                  </span>
                  <span className={`tool-access-badge ${fetchedEditAccess ? "tool-badge-editable" : "tool-badge-readonly"}`}>
                    {fetchedEditAccess ? <><FiUnlock size={11} /> Editable</> : <><FiLock size={11} /> Read-only</>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="tool-btn-pill tool-pill-refresh" onClick={handleRefresh} disabled={refreshing} title="Refresh">
                    <FiRefreshCw size={12} className={refreshing ? "tst-spin" : ""} />
                  </button>
                  <button className="tool-btn-pill tool-pill-copy" onClick={() => handleCopy(isEditing ? editedText : fetchedText)} title="Copy text">
                    <FiCopy size={12} /> Copy
                  </button>
                  <button className="tool-btn-pill tool-pill-fullscreen" onClick={() => setIsFullScreen(true)} title="Full screen">
                    <FiMaximize size={12} />
                  </button>
                  {fetchedEditAccess && !isEditing && (
                    <button className="tool-btn-pill tool-pill-edit" onClick={() => setIsEditing(true)}>
                      <FiEdit3 size={12} /> Edit
                    </button>
                  )}
                </div>
              </div>

              <textarea
                ref={fetchedTextareaRef}
                className={`tool-textarea ${isEditing ? "tool-textarea-editing" : "tool-textarea-readonly"}`}
                value={isEditing ? editedText : fetchedText}
                readOnly={!isEditing}
                onChange={e => setEditedText(e.target.value)}
                rows={5}
              />

              {fetchedEditAccess && isEditing && (
                <div className="tool-btn-actions">
                  <button className="tool-btn-pill tool-pill-save" onClick={handleSaveEdit} disabled={saving}>
                    <FiSave size={13} /> {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button className="tool-btn-pill tool-pill-cancel" onClick={handleCancelEdit}>
                    <FiX size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 2. Share text ── */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiEdit3 className="tool-inner-section-icon" />
              <h3 className="tool-inner-section-title">Share Text</h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--tool-gray-500)", margin: "0 0 10px" }}>
              Enter any text and generate a shareable code.
            </p>
            <textarea
              ref={textareaRef}
              className="tool-textarea"
              placeholder="Type or paste your text here…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
            />

            <div className="tool-toggle-row">
              <button
                type="button"
                className={`tool-toggle-btn ${editAccess ? "tool-toggle-btn-active" : ""}`}
                onClick={() => setEditAccess(v => !v)}
              >
                {editAccess ? <FiUnlock size={13} /> : <FiLock size={13} />}
                Edit Access: {editAccess ? "ON" : "OFF"}
              </button>
              <span className="tool-toggle-hint">
                {editAccess ? "Anyone with code can edit" : "View-only for recipients"}
              </span>
            </div>

            <div className="tool-btn-actions">
              <button
                style={{ background: "var(--tst-yellow)", color: "#5a3e00" }}
                className="tool-btn"
                onClick={handleGenerate}
                disabled={!text.trim()}
              >
                <FiSend size={14} /> Generate Code
              </button>
              <button className="tool-btn tool-btn-ghost" onClick={openCustomCodeModal} disabled={!text.trim()}>
                <FiCode size={14} /> Custom Code
              </button>
              {text && (
                <button className="tool-btn tool-btn-ghost" onClick={() => { setText(""); setCode(""); }}>
                  Clear
                </button>
              )}
            </div>

            {code && (
              <div className="tool-code-result">
                <div className="tool-code-result-label">Your Code</div>
                <div className="tool-code-display">
                  <span className="tool-code-value">{code}</span>
                  <button className="tool-btn-pill tool-pill-copy" onClick={() => handleCopy(code)}>
                    <FiCopy size={12} /> Copy
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className={`tool-access-badge ${editAccess ? "tool-badge-editable" : "tool-badge-readonly"}`}>
                    {editAccess ? <><FiUnlock size={11} /> Editable</> : <><FiLock size={11} /> Read-only</>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. My codes ── */}
          {myCodes.length > 0 && (
            <div className="tool-inner-section">
              <button className="tool-my-codes-toggle" onClick={() => setShowMyCodes(v => !v)}>
                <div className="tool-my-codes-toggle-left">
                  <FiList style={{ color: "var(--tst-orange-dark)", fontSize: 16 }} />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>My Codes</span>
                  <span className="tool-codes-count">{myCodes.length}</span>
                </div>
                {showMyCodes ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>

              {showMyCodes && (
                <div style={{ marginTop: 12 }}>
                  {myCodes.map(item => (
                    <div key={item.code} className="tool-file-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", color: "var(--tst-orange-dark)" }}>
                            {item.code}
                          </span>
                          <span className={`tool-access-badge ${item.editAccess ? "tool-badge-editable" : "tool-badge-readonly"}`}>
                            {item.editAccess ? <><FiUnlock size={10} /> Edit</> : <><FiLock size={10} /> View</>}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.73rem", color: "var(--tool-gray-400)", marginTop: 2 }}>
                          {formatTimeAgo(item.createdAt)}
                        </div>
                      </div>
                      <div className="tool-file-row-actions">
                        <button
                          className="tool-btn-pill tool-pill-copy"
                          onClick={() => handleCopy(item.code)}
                          title="Copy code"
                        >
                          <FiCopy size={12} />
                        </button>
                        <button
                          className={`tool-btn-pill ${item.editAccess ? "tool-pill-refresh" : "tool-pill-edit"}`}
                          onClick={() => handleToggleAccess(item.code, item.editAccess)}
                          disabled={togglingAccess === item.code}
                          title={item.editAccess ? "Make read-only" : "Enable editing"}
                        >
                          {togglingAccess === item.code
                            ? <FiRefreshCw size={12} className="tst-spin" />
                            : item.editAccess ? <FiLock size={12} /> : <FiUnlock size={12} />
                          }
                        </button>
                        <button
                          className="tool-btn-pill tool-pill-cancel"
                          onClick={() => handleDeleteCode(item.code)}
                          disabled={deletingCode === item.code}
                          title="Delete"
                        >
                          {deletingCode === item.code
                            ? <FiRefreshCw size={12} className="tst-spin" />
                            : <FiTrash2 size={12} />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="tool-notice-text" style={{ padding: "0 4px", marginTop: 4 }}>
            Texts expire after 24 hours. Do not share sensitive information.
          </p>
        </div>
      )}
    </div>
  );
}