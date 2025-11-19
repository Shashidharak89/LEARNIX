// app/components/WordToPdf.jsx
"use client";
import { useState } from "react";
import { FiUpload, FiDownload, FiTrash2 } from "react-icons/fi";
import "./styles/WordToPdf.css";

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function onFileChange(e) {
    setDownloadUrl("");
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus("");
    }
  }

  async function handleConvert() {
    if (!file) {
      setStatus("Please choose a .doc or .docx file.");
      return;
    }

    // Basic file validation on client-side
    const allowedTypes = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(doc|docx)$/i)) {
      setStatus("Invalid file type. Please upload a .doc or .docx file.");
      return;
    }

    setLoading(true);
    setStatus("Uploading and converting...");
    setDownloadUrl(""); // Reset download URL

    try {
      const fd = new FormData();
      fd.append("file", file, file.name);

      const res = await fetch("/api/convert/word-to-pdf", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        let errorMsg = "Server error.";
        try {
          const js = await res.json();
          errorMsg = js.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        setStatus(errorMsg);
        setLoading(false);
        return;
      }

      // Since the server returns the PDF directly, handle as blob for download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("Conversion complete. Click download.");
    } catch (err) {
      console.error("Conversion error:", err);
      setStatus("Network error or server unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setFile(null);
    setDownloadUrl("");
    setStatus("");
  }

  function handleDownload() {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `converted.pdf`; // You can set a default name or derive from file
    link.click();
  }

  return (
    <div className="ilp-container">
      <h2 className="ilp-title">Word → PDF</h2>

      <label className="ilp-dropzone">
        <input type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} />
        <div className="ilp-fileprompt">
          <div className="ilp-icon"><FiUpload size={20} /></div>
          <div>
            {file ? (
              <div className="ilp-fileinfo">
                <div className="ilp-fname">{file.name}</div>
                <div className="ilp-meta">{Math.round(file.size / 1024)} KB</div>
              </div>
            ) : (
              <div className="ilp-placeholder">
                <div>Select or drop a Word file</div>
                <div className="ilp-sub">DOC / DOCX</div>
              </div>
            )}
          </div>
        </div>
      </label>

      <div className="ilp-actions">
        <button className="ilp-btn primary" onClick={handleConvert} disabled={loading}>
          {loading ? "Converting..." : "Convert"}
        </button>
        <button className="ilp-btn ghost" onClick={clearAll} aria-label="Clear">
          <FiTrash2 /> Clear
        </button>
        {downloadUrl && (
          <button className="ilp-btn download" onClick={handleDownload}>
            <FiDownload /> Download PDF
          </button>
        )}
      </div>

      <div className="ilp-status">{status}</div>

      <div className="ilp-note">
        <small>Files are sent to iLoveAPI for conversion; secret key is kept on the server.</small>
      </div>
    </div>
  );
}
