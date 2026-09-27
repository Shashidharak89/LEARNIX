"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUpload, FiDownload, FiTrash2, FiCopy, FiFile, FiList,
  FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiChevronDown, FiChevronUp,
  FiEye, FiClock, FiCode, FiEdit3
} from "react-icons/fi";
import FileIcon from "../components/FileIcon";
import "./styles/ToolsPage.css";

export default function FileUploadDownload({ globalIsDragging, droppedFile, forceExpandTrigger }) {
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
  const [fetchedFile, setFetchedFile] = useState(null);

  // Custom Code State
  const [showCustomCodeInput, setShowCustomCodeInput] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [customCodeAvailable, setCustomCodeAvailable] = useState(null);
  const [checkingCustomCode, setCheckingCustomCode] = useState(false);

  // Auto-expand when page receives a drag (globalIsDragging prop from page.js)
  useEffect(() => {
    if (globalIsDragging && !isExpanded) {
      setIsExpanded(true);
    }
  }, [globalIsDragging, isExpanded]);

  // Auto-expand when triggered from header button click
  useEffect(() => {
    if (forceExpandTrigger) {
      setIsExpanded(true);
    }
  }, [forceExpandTrigger]);

  // When a file is dropped on the page, set it and expand card without any popup
  useEffect(() => {
    if (droppedFile) {
      setFile(droppedFile);
      setFileId("");
      setIsExpanded(true);
    }
  }, [droppedFile]);

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

  // Drop on the card's upload zone — no popup message
  const handleZoneDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(false);
    if (e.dataTransfer.files?.length > 0) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setFileId("");
      setIsExpanded(true);
    }
  }, []);

  const handleZoneDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(true);
  }, []);

  const handleZoneDragLeave = useCallback(() => {
    setUploadZoneHover(false);
  }, []);

  // Check custom code availability live
  const handleCheckCustomCode = async (val) => {
    const clean = val.toLowerCase().trim();
    setCustomCodeInput(clean);
    if (!clean) {
      setCustomCodeAvailable(null);
      return;
    }
    if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
      setCustomCodeAvailable(false);
      return;
    }
    setCheckingCustomCode(true);
    try {
      const fd = new FormData();
      fd.append("customCode", clean);
      fd.append("checkOnly", "true");
      const res = await fetch("/api/file/upload", { method: "POST", body: fd });
      const data = await res.json();
      setCustomCodeAvailable(data.available === true);
    } catch {
      setCustomCodeAvailable(null);
    } finally {
      setCheckingCustomCode(false);
    }
  };

  async function handleUpload() {
    if (!file) { showToast("Please choose a file.", "error"); return; }
    if (showCustomCodeInput && customCodeInput.trim() && customCodeAvailable === false) {
      showToast("Custom code is invalid or taken. Choose another.", "error");
      return;
    }

    setUploadLoading(true);
    showToast("Uploading…", "info");
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      if (showCustomCodeInput && customCodeInput.trim()) {
        fd.append("customCode", customCodeInput.trim());
      }

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
      showToast(`Upload complete! Code: ${data.fileId}`, "success");
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleFetchFile(idToFetch) {
    const targetId = (idToFetch || downloadId).trim();
    if (!targetId) { showToast("Enter a file code.", "error"); return; }
    setDownloadLoading(true);
    showToast("Fetching file preview…", "info");
    try {
      const res = await fetch(`/api/file/download/${targetId}`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "File not found or expired.", "error");
        return;
      }
      setFetchedFile(data);
      setIsExpanded(true);
      setDownloadId("");
      showToast("File found! Preview ready below.", "success");
    } catch {
      showToast("Failed to fetch file. Try again.", "error");
    } finally {
      setDownloadLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast("Copied code to clipboard!", "success");
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
    <div className={`tool-card tool-card-blue ${isExpanded ? "tool-card-expanded" : ""} ${globalIsDragging ? "tool-dragging" : ""}`}>

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
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetchFile(); } }}
          />
          <button
            className="tool-card-inline-btn"
            onClick={() => handleFetchFile()}
            disabled={downloadLoading || !downloadId.trim()}
          >
            <FiDownload size={14} />
            {downloadLoading ? "Fetching…" : "Fetch"}
          </button>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {isExpanded && (
        <div className="tool-card-body">

          {/* Fetched File Preview Card — rendered when a code is fetched */}
          {fetchedFile && (
            <div className="tool-inner-section tool-fetched-preview-box">
              <div className="tool-inner-section-header" style={{ marginBottom: 12 }}>
                <FiEye className="tool-inner-section-icon" />
                <h3 className="tool-inner-section-title">Retrieved File Preview</h3>
                <button
                  className="tool-toast-close"
                  style={{ marginLeft: "auto", background: "rgba(0,0,0,0.06)", color: "var(--tool-gray-700)" }}
                  onClick={() => setFetchedFile(null)}
                  title="Close Preview"
                >
                  <FiX size={14} />
                </button>
              </div>

              {/* Click anywhere on the card to navigate/open preview file */}
              <div
                className="upd-file-card"
                onClick={() => window.open(fetchedFile.viewUrl, "_blank", "noopener,noreferrer")}
                title="Click anywhere to view file preview"
              >
                <div className="upd-file-card-name">
                  {fetchedFile.isImage ? (
                    <img
                      src={fetchedFile.cloudinaryUrl}
                      alt={fetchedFile.fileName}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid rgba(0,0,0,0.1)",
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <FileIcon filename={fetchedFile.fileName} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
                    <span className="upd-file-card-label" title={fetchedFile.fileName}>
                      {fetchedFile.fileName}
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--tool-gray-500)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>Code: <strong style={{ color: "var(--tool-blue)", fontFamily: "monospace" }}>{fetchedFile.fileid}</strong></span>
                      {fetchedFile.size && (
                        <span>· {Math.round(fetchedFile.size / 1024)} KB</span>
                      )}
                      <span style={{ color: "#d97706", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <FiClock size={11} /> Auto-deletes in 24h
                      </span>
                    </span>
                  </div>
                </div>

                <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={fetchedFile.viewUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="upd-file-action-btn upd-file-action-view"
                    title="View File"
                  >
                    <FiEye size={15} />
                  </a>
                  <a
                    href={fetchedFile.downloadUrl}
                    download={fetchedFile.fileName}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="upd-file-action-btn upd-file-action-download"
                    title="Download File"
                  >
                    <FiDownload size={15} />
                  </a>
                  <button
                    className="tool-btn-pill"
                    onClick={() => copyToClipboard(fetchedFile.fileid)}
                    title="Copy Code"
                  >
                    <FiCopy size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  <p className="tool-upload-zone-hint">Supports all file types · Up to 100 MB · Auto-deletes in 24h</p>
                </>
              )}
            </div>

            {/* Custom code option toggle */}
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="tool-btn-pill"
                onClick={() => setShowCustomCodeInput(v => !v)}
                style={{ fontSize: "0.8rem" }}
              >
                <FiCode size={13} />
                {showCustomCodeInput ? "Use auto-generated code" : "Use custom code"}
              </button>

              {showCustomCodeInput && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Enter custom code (e.g. mypdf1)"
                      value={customCodeInput}
                      onChange={(e) => handleCheckCustomCode(e.target.value)}
                      className="tool-text-input"
                      style={{ maxWidth: 260, fontSize: "0.85rem", padding: "8px 12px" }}
                      maxLength={20}
                    />
                    {checkingCustomCode && <span className="tool-spinner" style={{ width: 16, height: 16 }}></span>}
                    {customCodeAvailable === true && (
                      <span style={{ color: "#16a34a", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                        <FiCheckCircle size={14} /> Available
                      </span>
                    )}
                    {customCodeAvailable === false && (
                      <span style={{ color: "#dc2626", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                        <FiAlertCircle size={14} /> Taken or invalid
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--tool-gray-500)" }}>
                    3-20 letters, numbers, hyphens or underscores
                  </span>
                </div>
              )}
            </div>

            <div className="tool-btn-actions" style={{ marginTop: 14 }}>
              <button
                className="tool-btn tool-btn-primary"
                onClick={handleUpload}
                disabled={uploadLoading || !file || (showCustomCodeInput && customCodeInput.trim() && customCodeAvailable === false)}
              >
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
                <span className="tool-file-id-label">File Code</span>
                <code className="tool-file-id-code">{fileId}</code>
                <button className="tool-btn-pill" onClick={() => copyToClipboard(fileId)}>
                  <FiCopy size={12} /> Copy
                </button>
              </div>
            )}
          </div>

          {(persistentFileId || allFiles.length > 0) && (
            <div className="tool-inner-section">
              <div className="tool-inner-section-header">
                <FiList className="tool-inner-section-icon" />
                <h3 className="tool-inner-section-title">Your Uploaded Files</h3>
              </div>

              {persistentFileId && (
                <div
                  className="upd-file-card"
                  onClick={() => handleFetchFile(persistentFileId)}
                  style={{ marginBottom: 10, cursor: "pointer" }}
                >
                  <div className="upd-file-card-name">
                    <FileIcon filename={persistentFileName} />
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span className="upd-file-card-label">{persistentFileName}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--tool-gray-500)" }}>
                        Code: <strong style={{ color: "var(--tool-blue)" }}>{persistentFileId}</strong> · Last uploaded
                      </span>
                    </div>
                  </div>
                  <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="tool-btn-pill" onClick={() => handleFetchFile(persistentFileId)}>
                      <FiEye size={12} /> Preview
                    </button>
                    <button className="tool-btn-pill" onClick={() => copyToClipboard(persistentFileId)}>
                      <FiCopy size={12} /> Copy Code
                    </button>
                    <button
                      className="tool-btn-pill tool-btn-pill-danger"
                      onClick={() => {
                        localStorage.removeItem("uploadedFileId");
                        localStorage.removeItem("uploadedFileName");
                        setPersistentFileId("");
                        setPersistentFileName("");
                      }}
                    >
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
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {allFiles.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", textAlign: "center", padding: "12px 0" }}>
                      No files uploaded yet.
                    </p>
                  ) : allFiles.map(f => (
                    <div
                      key={f.fileid}
                      className="upd-file-card"
                      onClick={() => handleFetchFile(f.fileid)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="upd-file-card-name">
                        <FileIcon filename={f.originalName} />
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span className="upd-file-card-label">{f.originalName}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--tool-gray-500)", fontFamily: "monospace" }}>
                            Code: {f.fileid}
                          </span>
                        </div>
                      </div>
                      <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="tool-btn-pill" onClick={() => handleFetchFile(f.fileid)}>
                          <FiEye size={12} /> Preview
                        </button>
                        <button className="tool-btn-pill" onClick={() => copyToClipboard(f.fileid)}>
                          <FiCopy size={12} /> Copy Code
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
