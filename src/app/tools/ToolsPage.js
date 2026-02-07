// File: components/ToolsPage.jsx
"use client";

import React, { useState } from "react";
import "./styles/ToolsPage.css";
import { FaFileWord, FaFilePdf, FaTools } from "react-icons/fa";
import { FiInfo, FiUpload, FiDownload, FiClock, FiShield } from "react-icons/fi";

export default function ToolsPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setStatus("");
  };

  const handleConvert = async () => {
    if (!file) return setStatus("Please pick a .docx file first.");
    setLoading(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/convert", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Conversion failed on server");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.docx?$/i, ".pdf");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus("Conversion complete — file downloaded.");
    } catch (err) {
      console.error(err);
      setStatus("Conversion failed. Try again or check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tp-page-container">
      <header className="tp-header" aria-hidden={true}>
        <FaTools className="tp-header-icon" />
      </header>

      <main className="tp-main" role="main">
        {/* Intro Card */}
        <section className="tp-card tp-intro" aria-labelledby="tp-title">
          <h1 id="tp-title" className="tp-title">Tools</h1>
          <p className="tp-plain">
            Handy file utilities — simple, fast, and responsive. Convert, transform, and manage your documents with ease.
          </p>
          <p className="tp-meta">Free to use • No signup required</p>
        </section>

        {/* About Tools */}
        <section className="tp-card" aria-labelledby="tp-about">
          <div className="tp-section-header">
            <FiInfo className="tp-section-icon" />
            <h2 id="tp-about" className="tp-subtitle">About Our Tools</h2>
          </div>
          <p className="tp-plain">
            We provide a collection of useful file conversion and document management tools. All tools run securely and your files are processed without being stored permanently.
          </p>
        </section>

        {/* Word to PDF Tool */}
        <section className="tp-card" aria-labelledby="tp-word-pdf">
          <div className="tp-section-header">
            <FaFileWord className="tp-section-icon" />
            <h2 id="tp-word-pdf" className="tp-subtitle">Word to PDF</h2>
          </div>
          <p className="tp-plain">
            Upload a DOCX document and get a clean, professional PDF instantly. Perfect for assignments, reports, and official documents.
          </p>

          <div className="tp-tool-body">
            <label className="tp-file-input">
              <FiUpload className="tp-upload-icon" />
              <span className="tp-file-choose">
                {file ? file.name : "Click to choose a Word file"}
              </span>
              <span className="tp-file-hint">Supports .doc and .docx files</span>
              <input
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onFileChange}
                aria-label="Upload Word document"
              />
            </label>

            <div className="tp-actions">
              <button
                className="tp-btn tp-btn-primary"
                onClick={handleConvert}
                disabled={!file || loading}
                aria-disabled={!file || loading}
              >
                <FiDownload className="tp-btn-icon" />
                {loading ? "Converting..." : "Convert to PDF"}
              </button>

              <button
                className="tp-btn tp-btn-ghost"
                onClick={() => {
                  setFile(null);
                  setStatus("");
                }}
                disabled={loading}
              >
                Clear
              </button>
            </div>

            {status && (
              <div className={`tp-status ${status.includes("complete") ? "tp-status-success" : "tp-status-error"}`}>
                <FaFilePdf className="tp-status-icon" />
                <span>{status}</span>
              </div>
            )}
          </div>
        </section>

        {/* Coming Soon */}
        <section className="tp-card tp-muted-card" aria-labelledby="tp-coming">
          <div className="tp-section-header">
            <FiClock className="tp-section-icon" />
            <h2 id="tp-coming" className="tp-subtitle">More Tools Coming Soon</h2>
          </div>
          <p className="tp-plain">
            We're working on adding more tools including PDF split, merge, compress, and image conversion. Stay tuned for updates!
          </p>
          <div className="tp-coming-badges">
            <span className="tp-badge">PDF Split</span>
            <span className="tp-badge">PDF Merge</span>
            <span className="tp-badge">PDF Compress</span>
            <span className="tp-badge">Image to PDF</span>
          </div>
        </section>

        {/* Security Note */}
        <section className="tp-card" aria-labelledby="tp-security">
          <div className="tp-section-header">
            <FiShield className="tp-section-icon" />
            <h2 id="tp-security" className="tp-subtitle">Security & Privacy</h2>
          </div>
          <p className="tp-plain">
            Your files are processed securely and are not stored on our servers after conversion. We use industry-standard encryption for all file transfers.
          </p>
          <p className="tp-meta">* Uses I Love PDF API (server-side processing)</p>
        </section>
      </main>
    </div>
  );
}
