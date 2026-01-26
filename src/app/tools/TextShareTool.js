"use client";
import { useState } from "react";
import { FiCopy, FiSend } from "react-icons/fi";
import "./styles/TextShare.css";

export default function TextShareTool() {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [fetchCode, setFetchCode] = useState("");
  const [fetchedText, setFetchedText] = useState("");
  const [status, setStatus] = useState("");

  async function handleGenerate() {
    setStatus("");
    setCode("");
    if (!text.trim()) {
      setStatus("Please enter some text.");
      return;
    }
    try {
      const res = await fetch("/api/textshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Failed to generate code.");
        return;
      }
      setCode(data.code);
      setStatus("Share this code with anyone!");
    } catch (err) {
      setStatus("Network error. Try again.");
    }
  }

  async function handleFetch() {
    setStatus("");
    setFetchedText("");
    if (!fetchCode.trim()) {
      setStatus("Please enter a code.");
      return;
    }
    try {
      const res = await fetch(`/api/textshare?code=${fetchCode.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Text not found.");
        return;
      }
      setFetchedText(data.text);
      setStatus("");
    } catch (err) {
      setStatus("Network error. Try again.");
    }
  }

  return (
    <div className="textshare-container">
      <h2 className="textshare-title">Text Sharing Tool</h2>
      <div className="textshare-section">
        <textarea
          className="textshare-textarea"
          placeholder="Type or paste any text here..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
        />
        <button className="textshare-btn" onClick={handleGenerate}>
          Generate Code <FiSend style={{ marginLeft: 6 }} />
        </button>
        {code && (
          <div className="textshare-codebox">
            <span className="textshare-label">Code:</span>
            <span className="textshare-code">{code}</span>
            <button
              className="textshare-btn ghost"
              onClick={() => { navigator.clipboard.writeText(code); setStatus("Code copied!"); }}
            >
              <FiCopy />
            </button>
          </div>
        )}
      </div>
      <hr className="textshare-divider" />
      <div className="textshare-section">
        <input
          className="textshare-input"
          type="text"
          placeholder="Enter code to view text"
          value={fetchCode}
          onChange={e => setFetchCode(e.target.value)}
        />
        <button className="textshare-btn" onClick={handleFetch}>
          View Text <FiSend style={{ marginLeft: 6 }} />
        </button>
        {fetchedText && (
          <div className="textshare-fetchedbox">
            <textarea
              className="textshare-fetched"
              value={fetchedText}
              readOnly
              rows={6}
            />
            <button
              className="textshare-btn ghost"
              onClick={() => { navigator.clipboard.writeText(fetchedText); setStatus("Text copied!"); }}
            >
              <FiCopy />
            </button>
          </div>
        )}
      </div>
      {status && <div className="textshare-status">{status}</div>}
      <div className="textshare-note">
        <small>Texts are deleted automatically after 24 hours.</small>
      </div>
    </div>
  );
}
