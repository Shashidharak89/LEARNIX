// app/tools/TextShareTool.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import { FiCopy, FiSend, FiMessageSquare, FiCode, FiShare2, FiEdit3, FiRefreshCw, FiSave, FiLock, FiUnlock } from "react-icons/fi";
import "./styles/TextShare.css";

export default function TextShareTool() {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [editAccess, setEditAccess] = useState(false); // Toggle for allowing edit access
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedText, setFetchedText] = useState("");
  const [fetchedEditAccess, setFetchedEditAccess] = useState(false); // Edit access of fetched text
  const [editedText, setEditedText] = useState(""); // For editing fetched text
  const [isEditing, setIsEditing] = useState(false); // Edit mode toggle
  const [currentCode, setCurrentCode] = useState(""); // Store code for refresh/update
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);
  const fetchedTextareaRef = useRef(null);

  // Auto-expand textarea
  const autoExpand = (ref) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      const maxHeight = window.innerHeight * 0.9;
      const newHeight = Math.min(ref.current.scrollHeight, maxHeight);
      ref.current.style.height = newHeight + 'px';
    }
  };

  useEffect(() => {
    autoExpand(textareaRef);
  }, [text]);

  useEffect(() => {
    autoExpand(fetchedTextareaRef);
  }, [fetchedText, editedText]);

  function showStatus(message, type = "") {
    setStatus(message);
    setStatusType(type);
  }

  async function handleGenerate() {
    showStatus("", "");
    setCode("");
    if (!text.trim()) {
      showStatus("Please enter some text.", "error");
      return;
    }
    try {
      showStatus("Generating code...", "");
      const res = await fetch("/api/textshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, editAccess }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus(data.error || "Failed to generate code.", "error");
        return;
      }
      setCode(data.code);
      const accessMsg = editAccess ? "Anyone can view AND edit!" : "View-only access.";
      showStatus(`Code generated! ${accessMsg}`, "success");
    } catch (err) {
      showStatus("Network error. Try again.", "error");
    }
  }

  async function handleFetch() {
    showStatus("", "");
    setFetchedText("");
    setEditedText("");
    setIsEditing(false);
    setFetchedEditAccess(false);
    if (!fetchCode.trim()) {
      showStatus("Please enter a code.", "error");
      return;
    }
    try {
      showStatus("Fetching text...", "");
      const res = await fetch(`/api/textshare?code=${fetchCode.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        showStatus(data.error || "Text not found.", "error");
        return;
      }
      setFetchedText(data.text);
      setEditedText(data.text);
      setFetchedEditAccess(data.editAccess || false);
      setCurrentCode(fetchCode.trim()); // Store for refresh/update
      const accessMsg = data.editAccess ? "(Editable)" : "(Read-only)";
      showStatus(`Text retrieved! ${accessMsg}`, "success");
    } catch (err) {
      showStatus("Network error. Try again.", "error");
    }
  }

  async function handleRefresh() {
    if (!currentCode) return;
    setRefreshing(true);
    showStatus("Refreshing...", "");
    try {
      const res = await fetch(`/api/textshare?code=${currentCode}`);
      const data = await res.json();
      if (!res.ok) {
        showStatus(data.error || "Failed to refresh.", "error");
        setRefreshing(false);
        return;
      }
      setFetchedText(data.text);
      setEditedText(data.text);
      setFetchedEditAccess(data.editAccess || false);
      showStatus("Text refreshed!", "success");
    } catch (err) {
      showStatus("Network error. Try again.", "error");
    }
    setRefreshing(false);
  }

  async function handleSaveEdit() {
    if (!currentCode || !editedText.trim()) {
      showStatus("Cannot save empty text.", "error");
      return;
    }
    setSaving(true);
    showStatus("Saving changes...", "");
    try {
      const res = await fetch("/api/textshare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, text: editedText }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus(data.error || "Failed to save.", "error");
        setSaving(false);
        return;
      }
      setFetchedText(data.text);
      setIsEditing(false);
      showStatus("Changes saved successfully!", "success");
    } catch (err) {
      showStatus("Network error. Try again.", "error");
    }
    setSaving(false);
  }

  function handleCancelEdit() {
    setEditedText(fetchedText);
    setIsEditing(false);
    showStatus("Edit cancelled.", "");
  }

  return (
    <div className="tst-page-container">
      <header className="tst-header" aria-hidden={true}>
        <FiMessageSquare className="tst-header-icon" />
      </header>

      <main className="tst-main" role="main">
        {/* Intro Card */}
        <section className="tst-card tst-intro" aria-labelledby="tst-title">
          <div className="tst-tool-number">2.</div>
          <h1 id="tst-title" className="tst-title">Text Sharing Tool</h1>
          <p className="tst-meta">Free to use • Share text instantly • Texts expire after 24 hours</p>
        </section>

        {/* Share Text Section */}
        <section className="tst-card" aria-labelledby="tst-share">
          <div className="tst-section-header">
            <FiEdit3 className="tst-section-icon" />
            <h2 id="tst-share" className="tst-subtitle">Share Text</h2>
          </div>
          <p className="tst-plain">Enter any text below and generate a unique code to share it with anyone.</p>
          
          <div className="tst-textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="tst-textarea"
              placeholder="Type or paste any text here..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
            />
          </div>

          {/* Edit Access Toggle */}
          <div className="tst-toggle-wrapper">
            <button
              type="button"
              className={`tst-toggle-btn ${editAccess ? 'tst-toggle-active' : ''}`}
              onClick={() => setEditAccess(!editAccess)}
            >
              {editAccess ? <FiUnlock /> : <FiLock />}
              <span>{editAccess ? 'Edit Access: ON' : 'Edit Access: OFF'}</span>
            </button>
            <span className="tst-toggle-hint">
              {editAccess 
                ? 'Anyone with the code can edit the text' 
                : 'Anyone with the code can only view the text'}
            </span>
          </div>
          
          <div className="tst-actions">
            <button className="tst-btn tst-btn-primary" onClick={handleGenerate}>
              <FiSend /> Generate Code
            </button>
            {text && (
              <button
                className="tst-btn tst-btn-ghost"
                onClick={() => setText("")}
              >
                Clear
              </button>
            )}
          </div>

          {code && (
            <div className="tst-result-box">
              <div className="tst-result-label">Your Code:</div>
              <div className="tst-code-display">
                <span className="tst-code">{code}</span>
                <button
                  className="tst-btn tst-btn-icon"
                  onClick={() => { navigator.clipboard.writeText(code); showStatus("Code copied!", "success"); }}
                  title="Copy code"
                >
                  <FiCopy />
                </button>
              </div>
              <div className="tst-access-badge">
                {editAccess ? (
                  <span className="tst-badge tst-badge-editable"><FiUnlock /> Editable</span>
                ) : (
                  <span className="tst-badge tst-badge-readonly"><FiLock /> Read-only</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Retrieve Text Section */}
        <section className="tst-card" aria-labelledby="tst-retrieve">
          <div className="tst-section-header">
            <FiCode className="tst-section-icon" />
            <h2 id="tst-retrieve" className="tst-subtitle">Retrieve Text</h2>
          </div>
          <p className="tst-plain">Enter a code to view the shared text.</p>
          
          <div className="tst-input-group">
            <input
              className="tst-input"
              type="text"
              placeholder="Enter code (e.g., abc123)"
              value={fetchCode}
              onChange={e => setFetchCode(e.target.value.toLowerCase())}
              maxLength={10}
            />
            <button className="tst-btn tst-btn-primary" onClick={handleFetch}>
              <FiShare2 /> View Text
            </button>
          </div>

          {fetchedText && (
            <div className="tst-fetched-container">
              <div className="tst-fetched-header">
                <div className="tst-fetched-title-row">
                  <span className="tst-fetched-label">Retrieved Text:</span>
                  {fetchedEditAccess ? (
                    <span className="tst-badge tst-badge-editable"><FiUnlock /> Editable</span>
                  ) : (
                    <span className="tst-badge tst-badge-readonly"><FiLock /> Read-only</span>
                  )}
                </div>
                <div className="tst-fetched-actions">
                  <button
                    className="tst-btn tst-btn-icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Refresh to get latest text"
                  >
                    <FiRefreshCw className={refreshing ? 'tst-spin' : ''} />
                  </button>
                  <button
                    className="tst-btn tst-btn-icon"
                    onClick={() => { navigator.clipboard.writeText(isEditing ? editedText : fetchedText); showStatus("Text copied!", "success"); }}
                    title="Copy text"
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
              
              <div className="tst-textarea-wrapper">
                {isEditing ? (
                  <textarea
                    ref={fetchedTextareaRef}
                    className="tst-textarea tst-textarea-editing"
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <textarea
                    ref={fetchedTextareaRef}
                    className="tst-textarea tst-textarea-readonly"
                    value={fetchedText}
                    readOnly
                    rows={4}
                  />
                )}
              </div>

              {/* Edit/Save Actions */}
              {fetchedEditAccess && (
                <div className="tst-edit-actions">
                  {isEditing ? (
                    <>
                      <button 
                        className="tst-btn tst-btn-primary" 
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        className="tst-btn tst-btn-ghost" 
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      className="tst-btn tst-btn-secondary" 
                      onClick={() => setIsEditing(true)}
                    >
                      <FiEdit3 /> Edit Text
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Status Message */}
        {status && (
          <div className={`tst-status ${statusType === 'error' ? 'tst-status-error' : statusType === 'success' ? 'tst-status-success' : ''}`}>
            {status}
          </div>
        )}

        {/* Notice Card */}
        <section className="tst-card tst-notice-card">
          <p className="tst-notice">
            <strong>Note:</strong> Texts are automatically deleted after 24 hours. Only share text that you're comfortable making accessible to anyone with the code.
          </p>
        </section>
      </main>
    </div>
  );
}
