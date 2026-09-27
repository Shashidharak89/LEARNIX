// app/tools/ToolsInfo.jsx
"use client";
import { useState } from "react";
import {
  FiUpload, FiDownload, FiShare2, FiClock, FiShield, FiInfo,
  FiEdit3, FiCode, FiLock, FiUnlock, FiCopy, FiChevronDown, FiChevronUp
} from "react-icons/fi";
import "./styles/ToolsInfo.css";
import "./styles/ToolsPage.css";

export default function ToolsInfo() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`tool-card ${isExpanded ? "tool-card-expanded" : ""}`}>

      {/* ── Header ── */}
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
            <h2 className="tool-card-title">Tools Information</h2>
            <span className="tool-card-subtitle">How to use File Upload &amp; Text Sharing</span>
          </div>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {isExpanded && (
        <div className="tool-card-body">

          {/* ── Tool 1 ── */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiUpload className="tool-inner-section-icon" />
              <h3 className="tool-inner-section-title">File Upload &amp; Download</h3>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", margin: "0 0 14px" }}>
              Upload any file to the cloud and share it instantly using a unique File ID.
              Free to use · No signup required · Up to 100 MB per file.
            </p>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--tool-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                How it works
              </div>
              {[
                { n: 1, t: "Upload", d: "Click the upload zone or drag & drop any file (up to 100 MB)." },
                { n: 2, t: "Get your ID", d: "After upload you receive a unique File ID." },
                { n: 3, t: "Share & download", d: "Share the File ID. Anyone can download it instantly." },
              ].map(s => (
                <div key={s.n} className="tool-info-step">
                  <div className="tool-info-step-num">{s.n}</div>
                  <div>
                    <p className="tool-info-step-title">{s.t}</p>
                    <p className="tool-info-step-desc">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="tool-features-grid">
              {[
                { icon: <FiUpload />, t: "Easy Upload", d: "All file types up to 100 MB" },
                { icon: <FiDownload />, t: "Quick Download", d: "Instant download via File ID" },
                { icon: <FiShare2 />, t: "Easy Sharing", d: "Share the ID with anyone" },
                { icon: <FiClock />, t: "Auto-expiry", d: "Files deleted after 24 hours" },
              ].map(f => (
                <div key={f.t} className="tool-feature-item">
                  <span className="tool-feature-icon">{f.icon}</span>
                  <div>
                    <p className="tool-feature-title">{f.t}</p>
                    <p className="tool-feature-desc">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="tool-badge-row">
                <span className="tool-badge"><FiShield size={11} /> Secure</span>
                <span className="tool-badge">No signup</span>
                <span className="tool-badge">Free</span>
                <span className="tool-badge">100 MB limit</span>
                <span className="tool-badge">24h expiry</span>
              </div>
            </div>
          </div>

          {/* ── Tool 2 ── */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiEdit3 className="tool-inner-section-icon" />
              <h3 className="tool-inner-section-title">Text Sharing</h3>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", margin: "0 0 14px" }}>
              Share text snippets instantly using a short code.
              Useful for sharing code, notes, messages, and more.
              Texts expire after 24 hours.
            </p>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--tool-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                How it works
              </div>
              {[
                { n: 1, t: "Write", d: "Type or paste any text in the Share Text field." },
                { n: 2, t: "Generate code", d: "Click Generate Code — you get a short shareable code." },
                { n: 3, t: "Retrieve", d: "Anyone with the code can fetch your text instantly." },
                { n: 4, t: "Edit (optional)", d: "Enable Edit Access so recipients can update the text too." },
              ].map(s => (
                <div key={s.n} className="tool-info-step">
                  <div className="tool-info-step-num">{s.n}</div>
                  <div>
                    <p className="tool-info-step-title">{s.t}</p>
                    <p className="tool-info-step-desc">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="tool-features-grid">
              {[
                { icon: <FiCode />, t: "Custom Codes", d: "Choose your own memorable code" },
                { icon: <FiUnlock />, t: "Edit Access", d: "Grant edit permission to anyone" },
                { icon: <FiLock />, t: "View-only", d: "Read-only mode by default" },
                { icon: <FiCopy />, t: "My Codes", d: "Manage all codes you've created" },
              ].map(f => (
                <div key={f.t} className="tool-feature-item">
                  <span className="tool-feature-icon">{f.icon}</span>
                  <div>
                    <p className="tool-feature-title">{f.t}</p>
                    <p className="tool-feature-desc">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="tool-badge-row">
                <span className="tool-badge"><FiInfo size={11} /> Free</span>
                <span className="tool-badge">No signup</span>
                <span className="tool-badge">24h expiry</span>
                <span className="tool-badge">Custom codes</span>
              </div>
            </div>
          </div>

          <p className="tool-notice-text" style={{ padding: "0 4px" }}>
            <strong>Privacy:</strong> All uploaded files and texts are accessible to anyone with the ID or code.
            Do not share sensitive personal information.
          </p>
        </div>
      )}
    </div>
  );
}