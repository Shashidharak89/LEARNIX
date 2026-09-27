// app/components/WordToPdf.jsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUpload, FiDownload, FiTrash2, FiCopy, FiFile, FiList,
  FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiChevronDown, FiChevronUp
} from "react-icons/fi";
import "./styles/ToolsPage.css";

export default function FileUploadDownload({ globalIsDragging }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [downloadId, setDownloadId] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileId, setFileId] = useState("");
  const [persistentFileId, setPersistentFileId] = useState("");
  const [persistentFileName, setPersistentFileName] = useState("");
  const [allFiles, setAllFiles] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [uploadZoneHover, setUploadZoneHover] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Auto-expand when page receives a drag (globalIsDragging prop from page.js)
  useEffect(() => {
    if (globalIsDragging && !isExpanded) {
      setIsExpanded(true);
    }
  }, [globalIsDragging, isExpanded]);

  useEffect(() => {
    const storedFileId = localStorage.getItem("uploadedFileId");
    const storedFileName = localStorage.getItem("uploadedFileName");
    if (storedFileId && storedFileName) {
      setPersistentFileId(storedFileId);
      setPersistentFileName(storedFileName);
    }
    const userFiles = JSON.parse(localStorage.getItem("userUploadedFiles") || "[]");
    setAllFiles(userFiles);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

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

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setFileId(""); }
  }

  // Drop on the card's upload zone
  const handleZoneDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(false);
    if (e.dataTransfer.files?.length > 0) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setFileId("");
      showToast(`"${dropped.name}" ready to upload!`, "success");
    }
  }, [showToast]);

  const handleZoneDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(true);
  }, []);

  const handleZoneDragLeave = useCallback(() => {
    setUploadZoneHover(false);
  }, []);

  async function handleUpload() {
    if (!file) { showToast("Please choose a file.", "error"); return; }
    setUploadLoading(true);
    showToast("Uploading…", "info");
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/file/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Upload failed", "error"); return; }

      setFileId(data.fileId);
      setPersistentFileId(data.fileId);
      setPersistentFileName(file.name);
      localStorage.setItem("uploadedFileId", data.fileId);
      localStorage.setItem("uploadedFileName", file.name);

      const userFiles = JSON.parse(localStorage.getItem("userUploadedFiles") || "[]");
      const updated = [{ fileid: data.fileId, originalName: file.name }, ...userFiles];
      localStorage.setItem("userUploadedFiles", JSON.stringify(updated));
      setAllFiles(updated);
      showToast(`Upload complete! ID: ${data.fileId}`, "success");
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  async function downloadFile(id) {
    setDownloadLoading(true);
    showToast("Fetching download link…", "info");
    try {
      const res = await fetch(`/api/file/download/${id}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to fetch link", "error"); return; }
      const a = document.createElement("a");
      a.href = data.downloadUrl;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Download started!", "success");
    } catch {
      showToast("Download failed. Try again.", "error");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDownload() {
    if (!downloadId.trim()) { showToast("Enter a file ID.", "error"); return; }
    downloadFile(downloadId.trim());
    setDownloadId("");
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  }

  function removeFile(id) {
    const updated = allFiles.filter(f => f.fileid !== id);
    setAllFiles(updated);
    localStorage.setItem("userUploadedFiles", JSON.stringify(updated));
  }

  const fileZoneClass = [
    "tool-upload-zone",
    file ? "upload-zone-has-file" : "",
    (uploadZoneHover || globalIsDragging) ? "upload-zone-hover" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={`tool-card ${isExpanded ? "tool-card-expanded" : ""} ${globalIsDragging ? "tool-dragging" : ""}`}>

      {/* Toast */}
      {toast && (
        <div className={`tool-toast tool-toast-${toast.type}`}>
          <span className="tool-toast-icon">{getToastIcon(toast.type)}</span>
          <span>{toast.message}</span>
          <button className="tool-toast-close" onClick={dismissToast}><FiX /></button>
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
            <h2 className="tool-card-title">File Upload</h2>
            <span className="tool-card-subtitle">Upload &amp; share files — or enter a code to download</span>
          </div>
        </div>

        {/* Inline download field — always visible */}
        <div
          className="tool-card-header-inline"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Enter code to download"
            value={downloadId}
            onChange={(e) => setDownloadId(e.target.value)}
            className="tool-card-inline-input"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleDownload(); } }}
          />
          <button
            className="tool-card-inline-btn"
            onClick={handleDownload}
            disabled={downloadLoading || !downloadId.trim()}
          >
            <FiDownload size={14} />
            {downloadLoading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {isExpanded && (
        <div className="tool-card-body">

          {/* Upload section */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiUpload className="tool-inner-section-icon" />
              <h3 className="tool-inner-section-title">Upload File</h3>
            </div>

            <div
              className={fileZoneClass}
              onDragOver={handleZoneDragOver}
              onDragLeave={handleZoneDragLeave}
              onDrop={handleZoneDrop}
            >
              <input type="file" accept="*" onChange={onFileChange} />
              <div className="tool-upload-zone-icon">
                {file ? <FiCheckCircle /> : <FiUpload />}
              </div>
              {file ? (
                <>
                  <p className="tool-upload-zone-filename">{file.name}</p>
                  <p className="tool-upload-zone-hint">{Math.round(file.size / 1024)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <p className="tool-upload-zone-label">Click to choose or drag &amp; drop</p>
                  <p className="tool-upload-zone-hint">Supports all file types · Up to 100 MB</p>
                </>
              )}
            </div>

            <div className="tool-btn-actions">
              <button className="tool-btn tool-btn-primary" onClick={handleUpload} disabled={uploadLoading || !file}>
                <FiUpload size={15} />
                {uploadLoading ? "Uploading…" : "Upload"}
              </button>
              {file && (
                <button className="tool-btn tool-btn-ghost" onClick={() => { setFile(null); setFileId(""); }}>
                  <FiTrash2 size={14} /> Clear
                </button>
              )}
            </div>

            {fileId && (
              <div className="tool-file-id-box">
                <span className="tool-file-id-label">File ID</span>
                <code className="tool-file-id-code">{fileId}</code>
                <button className="tool-btn-pill" onClick={() => copyToClipboard(fileId)}>
                  <FiCopy size={12} /> Copy
                </button>
              </div>
            )}
          </div>

          {/* Download by ID section */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiDownload className="tool-inner-section-icon" />
              <h3 className="tool-inner-section-title">Download by ID</h3>
            </div>
            <input
              type="text"
              className="tool-text-input"
              placeholder="Paste file ID here…"
              value={downloadId}
              onChange={(e) => setDownloadId(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDownload(); }}
            />
            <div className="tool-btn-actions">
              <button className="tool-btn tool-btn-primary" onClick={handleDownload} disabled={downloadLoading || !downloadId.trim()}>
                <FiDownload size={15} />
                {downloadLoading ? "Downloading…" : "Download"}
              </button>
              {downloadId && (
                <button className="tool-btn tool-btn-ghost" onClick={() => setDownloadId("")}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Uploaded files history */}
          {(persistentFileId || allFiles.length > 0) && (
            <div className="tool-inner-section">
              <div className="tool-inner-section-header">
                <FiList className="tool-inner-section-icon" />
                <h3 className="tool-inner-section-title">Your Uploaded Files</h3>
              </div>

              {persistentFileId && (
                <div className="tool-file-row" style={{ marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tool-file-row-name">{persistentFileName}</div>
                    <div className="tool-file-row-sub">Last uploaded</div>
                  </div>
                  <div className="tool-file-row-actions">
                    <button className="tool-btn-pill" onClick={() => downloadFile(persistentFileId)} disabled={downloadLoading}>
                      <FiDownload size={12} /> Download
                    </button>
                    <button className="tool-btn-pill" onClick={() => copyToClipboard(persistentFileId)}>
                      <FiCopy size={12} /> Copy ID
                    </button>
                    <button className="tool-btn-pill tool-btn-pill-danger" onClick={() => {
                      localStorage.removeItem("uploadedFileId");
                      localStorage.removeItem("uploadedFileName");
                      setPersistentFileId("");
                      setPersistentFileName("");
                    }}>
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>
              )}

              <button
                className="tool-btn tool-btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setShowAll(v => !v)}
              >
                <FiList size={14} />
                {showAll ? "Hide" : "Show"} all uploads ({allFiles.length})
              </button>

              {showAll && (
                <div style={{ marginTop: 10 }}>
                  {allFiles.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", textAlign: "center", padding: "12px 0" }}>
                      No files uploaded yet.
                    </p>
                  ) : allFiles.map(f => (
                    <div key={f.fileid} className="tool-file-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tool-file-row-name">{f.originalName}</div>
                        <div className="tool-file-row-sub" style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{f.fileid}</div>
                      </div>
                      <div className="tool-file-row-actions">
                        <button className="tool-btn-pill" onClick={() => downloadFile(f.fileid)} disabled={downloadLoading}>
                          <FiDownload size={12} />
                        </button>
                        <button className="tool-btn-pill" onClick={() => copyToClipboard(f.fileid)}>
                          <FiCopy size={12} />
                        </button>
                        <button className="tool-btn-pill tool-btn-pill-danger" onClick={() => removeFile(f.fileid)}>
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
