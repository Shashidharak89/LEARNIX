// app/tools/TextShareTool.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import { FiCopy, FiSend, FiMessageSquare, FiCode, FiShare2, FiEdit3 } from "react-icons/fi";
import "./styles/TextShare.css";

export default function TextShareTool() {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedText, setFetchedText] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
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
  }, [fetchedText]);

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
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus(data.error || "Failed to generate code.", "error");
        return;
      }
      setCode(data.code);
      showStatus("Share this code with anyone!", "success");
    } catch (err) {
      showStatus("Network error. Try again.", "error");
    }
  }

  async function handleFetch() {
    showStatus("", "");
    setFetchedText("");
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
      showStatus("Text retrieved successfully!", "success");
    } catch (err) {
      showStatus("Network error. Try again.", "error");
    }
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
              placeholder="Enter code (e.g., ABC123)"
              value={fetchCode}
              onChange={e => setFetchCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <button className="tst-btn tst-btn-primary" onClick={handleFetch}>
              <FiShare2 /> View Text
            </button>
          </div>

          {fetchedText && (
            <div className="tst-fetched-container">
              <div className="tst-fetched-header">
                <span className="tst-fetched-label">Retrieved Text:</span>
                <button
                  className="tst-btn tst-btn-icon"
                  onClick={() => { navigator.clipboard.writeText(fetchedText); showStatus("Text copied!", "success"); }}
                  title="Copy text"
                >
                  <FiCopy />
                </button>
              </div>
              <div className="tst-textarea-wrapper">
                <textarea
                  ref={fetchedTextareaRef}
                  className="tst-textarea tst-textarea-readonly"
                  value={fetchedText}
                  readOnly
                  rows={4}
                />
              </div>
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
