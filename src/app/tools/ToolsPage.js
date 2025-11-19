// File: components/ToolsPage.jsx
import React, { useState } from "react";
import "./styles/ToolsPage.css";
import { FaFileWord, FaFilePdf, FaTools } from "react-icons/fa";

export default function ToolsPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setStatus("");
    setProgress(0);
  };

  // Sends the file to your server-side API at /api/convert
  // The server should forward the request to the I Love PDF API using the
  // secret env var I_LOVE_API (server-side only). This keeps the key private.
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

      // stream or blob response support: try to get blob and download
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
      setProgress(0);
    }
  };

  return (
    <main className="tp-page">
      <div className="tp-wrapper">
        <header className="tp-header">
          <div className="tp-brand">
            <FaTools className="tp-brand-icon" />
            <h1 className="tp-title">Tools</h1>
          </div>
          <p className="tp-sub">Handy file utilities — simple, fast, responsive.</p>
        </header>

        <section className="tp-section">
          <h2 className="tp-section-title">Document Conversion</h2>

          <div className="tp-tools-grid">
            <article className="tp-tool-card">
              <div className="tp-tool-head">
                <FaFileWord className="tp-tool-icon" />
                <div>
                  <h3 className="tp-tool-name">Word to PDF</h3>
                  <p className="tp-tool-desc">Upload a DOCX and get a clean PDF.</p>
                </div>
              </div>

              <div className="tp-tool-body">
                <label className="tp-file-input">
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={onFileChange}
                    aria-label="Upload Word document"
                  />
                  <span className="tp-file-choose">Choose file</span>
                </label>

                <div className="tp-actions">
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={handleConvert}
                    disabled={!file || loading}
                    aria-disabled={!file || loading}
                  >
                    {loading ? "Converting..." : "Convert"}
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

                <div className="tp-status-row">
                  <FaFilePdf className="tp-status-icon" />
                  <div className="tp-status-text">
                    <div className="tp-filename">{file ? file.name : "No file selected"}</div>
                    <div className="tp-message">{status}</div>
                  </div>
                </div>
              </div>
            </article>

            {/* placeholder for future tools - keeps layout flexible */}
            <article className="tp-tool-card tp-tool-card-muted">
              <div className="tp-tool-head">
                <FaTools className="tp-tool-icon" />
                <div>
                  <h3 className="tp-tool-name">More tools coming</h3>
                  <p className="tp-tool-desc">PDF split, merge, compress — coming soon.</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <footer className="tp-footer">* Uses I Love PDF (server-side key). Keep API key secret.</footer>
      </div>
    </main>
  );
}
