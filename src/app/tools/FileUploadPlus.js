"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUpload, FiDownload, FiTrash2, FiCopy, FiFile, FiList,
  FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiChevronDown, FiChevronUp,
  FiEye, FiClock, FiZap, FiShield, FiRefreshCw, FiExternalLink
} from "react-icons/fi";
import FileIcon from "../components/FileIcon";
import "./styles/ToolsPage.css";

export default function FileUploadPlus({ forceExpandTrigger }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [file, setFile] = useState(null);
  const [isListed, setIsListed] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [downloadCode, setDownloadCode] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [resultTicket, setResultTicket] = useState(null);
  const [fetchedFile, setFetchedFile] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [myUploads, setMyUploads] = useState([]);
  const [showMyUploads, setShowMyUploads] = useState(false);
  const [uploadZoneHover, setUploadZoneHover] = useState(false);
  const [cardIsDragging, setCardIsDragging] = useState(false);
  const cardDragDepthRef = useRef(0);
  const [toast, setToast] = useState(null);

  const toastTimeoutRef = useRef(null);
  const xhrRef = useRef(null);

  // Auto-expand when triggered
  useEffect(() => {
    if (forceExpandTrigger) {
      setIsExpanded(true);
    }
  }, [forceExpandTrigger]);

  // Load user saved uploads from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("userUploadedFilesPlus") || "[]");
    setMyUploads(saved);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (xhrRef.current) xhrRef.current.abort();
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

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
    return bytes + " B";
  };

  const formatTimeLeft = (ts) => {
    if (!ts) return "";
    const diffMin = Math.floor((ts - Date.now()) / 60000);
    if (diffMin <= 0) return "Expiring soon";
    if (diffMin < 60) return `${diffMin} min left`;
    return `${Math.floor(diffMin / 60)}h left`;
  };

  const formatAgo = (ts) => {
    if (!ts) return "";
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    return `${Math.floor(sec / 3600)} h ago`;
  };

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 100 * 1024 * 1024) {
        showToast("File exceeds maximum 100 MB limit.", "error");
        return;
      }
      setFile(f);
      setResultTicket(null);
    }
  }

  // Inner zone drop handler
  const handleZoneDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(false);
    setCardIsDragging(false);
    cardDragDepthRef.current = 0;
    if (e.dataTransfer.files?.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.size > 100 * 1024 * 1024) {
        showToast("File exceeds maximum 100 MB limit.", "error");
        return;
      }
      setFile(dropped);
      setResultTicket(null);
      setIsExpanded(true);
      showToast(`Selected "${dropped.name}" for File Upload +`, "info");
    }
  }, [showToast]);

  const handleZoneDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(true);
  }, []);

  const handleZoneDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneHover(false);
  }, []);

  // Card-level Drag and Drop (strictly independent — does NOT affect FileUpload)
  const handleCardDragEnter = useCallback((e) => {
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      cardDragDepthRef.current += 1;
      setCardIsDragging(true);
    }
  }, []);

  const handleCardDragOver = useCallback((e) => {
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleCardDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    cardDragDepthRef.current -= 1;
    if (cardDragDepthRef.current <= 0) {
      cardDragDepthRef.current = 0;
      setCardIsDragging(false);
    }
  }, []);

  const handleCardDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    cardDragDepthRef.current = 0;
    setCardIsDragging(false);
    setUploadZoneHover(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.size > 100 * 1024 * 1024) {
        showToast("File exceeds maximum 100 MB limit.", "error");
        return;
      }
      setFile(dropped);
      setResultTicket(null);
      setIsExpanded(true);
      showToast(`Selected "${dropped.name}" for File Upload +`, "info");
    }
  }, [showToast]);

  // Upload file with accurate real-time speed & progress calculation
  function handleUpload() {
    if (!file) {
      showToast("Please choose a file to upload.", "error");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showToast("File exceeds maximum 100 MB limit.", "error");
      return;
    }

    setUploadLoading(true);
    setResultTicket(null);

    const fd = new FormData();
    fd.append("file", file, file.name);
    fd.append("listed", isListed ? "1" : "0");

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;
    let smoothedSpeed = 0;

    setProgressData({
      percent: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      speedText: "Starting...",
      etaText: "Calculating..."
    });

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
        const now = Date.now();
        const timeDelta = (now - lastTime) / 1000;

        if (timeDelta >= 0.2) {
          const bytesDelta = e.loaded - lastLoaded;
          const currentSpeed = bytesDelta / timeDelta;
          smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : (0.65 * smoothedSpeed + 0.35 * currentSpeed);
          lastLoaded = e.loaded;
          lastTime = now;
        }

        const effectiveSpeed = smoothedSpeed > 0 ? smoothedSpeed : ((now - startTime) > 0 ? e.loaded / ((now - startTime) / 1000) : 0);
        const remainingBytes = Math.max(0, e.total - e.loaded);
        const etaSec = effectiveSpeed > 0 ? remainingBytes / effectiveSpeed : 0;

        let etaText = "";
        if (percent >= 99) {
          etaText = "Finishing & indexing...";
        } else if (etaSec > 0) {
          if (etaSec < 60) {
            etaText = `${Math.ceil(etaSec)}s remaining`;
          } else {
            const mins = Math.floor(etaSec / 60);
            const secs = Math.ceil(etaSec % 60);
            etaText = `${mins}m ${secs}s remaining`;
          }
        }

        setProgressData({
          percent,
          uploadedBytes: e.loaded,
          totalBytes: e.total,
          speedText: effectiveSpeed > 0 ? `${formatSize(effectiveSpeed)}/s` : "Uploading...",
          etaText: etaText || "Processing..."
        });
      }
    };

    xhr.onload = () => {
      xhrRef.current = null;
      setUploadLoading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          setResultTicket(data);
          setProgressData(null);
          showToast(`Upload complete! Code: ${data.code}`, "success");

          // Save to user upload history
          const newItem = {
            code: data.code,
            name: data.name || file.name,
            size: data.size || file.size,
            expiresAt: data.expiresAt || (Date.now() + 86400000),
            createdAt: Date.now()
          };
          const updated = [newItem, ...myUploads];
          setMyUploads(updated);
          localStorage.setItem("userUploadedFilesPlus", JSON.stringify(updated));

          setFile(null);
          if (showRecent) fetchRecentFiles();
        } else {
          showToast(data.error || "Upload failed. Please try again.", "error");
        }
      } catch {
        showToast("Upload response error. Try again.", "error");
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setUploadLoading(false);
      showToast("Network error during upload.", "error");
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      setUploadLoading(false);
      setProgressData(null);
      showToast("Upload cancelled.", "info");
    };

    // Forward upload through fast proxy route to Edge Worker
    xhr.open("POST", "/api/tools/upload-plus");
    xhr.send(fd);
  }

  function handleCancelUpload() {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  }

  // Download by code
  function handleDownloadByCode(codeToUse) {
    const code = String(codeToUse || downloadCode).trim().toUpperCase();
    if (!code || code.length !== 6) {
      showToast("Enter a valid 6-character code.", "error");
      return;
    }

    setDownloadLoading(true);
    showToast(`Opening file ${code}...`, "info");

    // Initiate direct browser download via proxy
    const downloadUrl = `/api/tools/download-plus/${encodeURIComponent(code)}`;
    window.location.href = downloadUrl;

    setTimeout(() => {
      setDownloadLoading(false);
    }, 1200);
  }

  // Fetch recent files list
  async function fetchRecentFiles() {
    setRecentLoading(true);
    try {
      const res = await fetch("/api/tools/files-plus");
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setRecentFiles(data.files);
      }
    } catch {
      showToast("Could not load recent uploads.", "error");
    } finally {
      setRecentLoading(false);
    }
  }

  function toggleRecentFiles() {
    if (!showRecent && recentFiles.length === 0) {
      fetchRecentFiles();
    }
    setShowRecent(v => !v);
  }

  function copyToClipboard(text, label = "Code") {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, "success");
  }

  function removeMyUpload(code) {
    const updated = myUploads.filter(f => f.code !== code);
    setMyUploads(updated);
    localStorage.setItem("userUploadedFilesPlus", JSON.stringify(updated));
  }

  const fileZoneClass = [
    "tool-upload-zone",
    file ? "upload-zone-has-file" : "",
    (uploadZoneHover || cardIsDragging) ? "upload-zone-hover" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={`tool-card tool-card-plus ${isExpanded ? "tool-card-expanded" : ""} ${cardIsDragging ? "tool-card-dragging-plus" : ""}`}
      onDragEnter={handleCardDragEnter}
      onDragOver={handleCardDragOver}
      onDragLeave={handleCardDragLeave}
      onDrop={handleCardDrop}
    >

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 className="tool-card-title">File Upload +</h2>
              <span className="tool-plus-badge">
                <FiZap size={11} /> 100 MB · FAST
              </span>
            </div>
            <span className="tool-card-subtitle">
              High-speed edge upload · 6-character code · Auto-deletes in 24h
            </span>
          </div>
        </div>

        {/* Inline download field */}
        <div
          className="tool-card-header-inline"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Enter 6-char code"
            value={downloadCode}
            onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="tool-card-inline-input"
            style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleDownloadByCode();
              }
            }}
          />
          <button
            className="tool-card-inline-btn tool-btn-plus-accent"
            onClick={() => handleDownloadByCode()}
            disabled={downloadLoading || downloadCode.trim().length !== 6}
          >
            <FiDownload size={14} />
            {downloadLoading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {isExpanded && (
        <div className="tool-card-body">

          {/* Result Ticket Card when upload finishes */}
          {resultTicket && (
            <div className="tool-inner-section tool-plus-ticket">
              <div className="tool-inner-section-header" style={{ marginBottom: 10 }}>
                <FiCheckCircle className="tool-inner-section-icon" style={{ color: "#10b981" }} />
                <h3 className="tool-inner-section-title">Upload Successful!</h3>
                <button
                  className="tool-toast-close"
                  style={{ marginLeft: "auto", background: "rgba(0,0,0,0.06)", color: "var(--tool-gray-700)" }}
                  onClick={() => setResultTicket(null)}
                  title="Close Ticket"
                >
                  <FiX size={14} />
                </button>
              </div>

              <div className="tool-plus-ticket-body">
                <span className="tool-plus-ticket-label">Share this 6-character code:</span>
                <div className="tool-plus-ticket-code">{resultTicket.code}</div>
                <div className="tool-plus-ticket-meta">
                  <strong>{resultTicket.name}</strong> · {formatSize(resultTicket.size)} · Auto-deletes in 24 hours
                </div>

                <div className="tool-plus-ticket-actions">
                  <button
                    className="tool-btn-pill tool-btn-pill-active"
                    onClick={() => copyToClipboard(resultTicket.code, "Code")}
                  >
                    <FiCopy size={13} /> Copy Code
                  </button>
                  <button
                    className="tool-btn-pill"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/tools/download-plus/${resultTicket.code}`, "Download link")}
                  >
                    <FiExternalLink size={13} /> Copy Download Link
                  </button>
                  <button
                    className="tool-btn-pill"
                    onClick={() => handleDownloadByCode(resultTicket.code)}
                  >
                    <FiDownload size={13} /> Download Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiZap className="tool-inner-section-icon" style={{ color: "#10b981" }} />
              <h3 className="tool-inner-section-title">Upload to Edge Cache</h3>
            </div>

            <div
              className={fileZoneClass}
              onDragOver={handleZoneDragOver}
              onDragLeave={handleZoneDragLeave}
              onDrop={handleZoneDrop}
            >
              <input type="file" accept="*" onChange={onFileChange} />
              <div className="tool-upload-zone-icon" style={{ color: "#10b981" }}>
                {file ? <FiCheckCircle /> : <FiZap />}
              </div>
              {file ? (
                <>
                  <p className="tool-upload-zone-filename">{file.name}</p>
                  <p className="tool-upload-zone-hint">{formatSize(file.size)} · Click to change</p>
                </>
              ) : (
                <>
                  <p className="tool-upload-zone-label">Click to choose or drag &amp; drop</p>
                  <p className="tool-upload-zone-hint">
                    Ultra-fast edge delivery · Supports up to 100 MB · Auto-deletes in 24h
                  </p>
                </>
              )}
            </div>

            {/* Listed in public list checkbox */}
            <div style={{ marginTop: 12 }}>
              <label className="tool-plus-checkbox-label">
                <input
                  type="checkbox"
                  checked={isListed}
                  onChange={(e) => setIsListed(e.target.checked)}
                  className="tool-plus-checkbox"
                />
                <span>Show in public recent uploads list</span>
              </label>
            </div>

            {/* Real-time High-Precision Progress Banner */}
            {uploadLoading && progressData && (
              <div className="tool-uploading-banner tool-uploading-banner-plus">
                <div className="tool-uploading-header">
                  <div className="tool-uploading-left">
                    <span className="tool-spinner tool-spinner-green"></span>
                    <div className="tool-uploading-info">
                      <span className="tool-uploading-filename-title" title={file?.name}>
                        {file?.name}
                      </span>
                      <span className="tool-status-stat">
                        <strong style={{ color: "#059669" }}>
                          {formatSize(progressData.uploadedBytes)}
                        </strong>{" "}
                        of {formatSize(progressData.totalBytes)}
                      </span>
                    </div>
                  </div>
                  <div className="tool-uploading-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="tool-uploading-percent tool-uploading-percent-green">
                      {progressData.percent}%
                    </span>
                    <button
                      type="button"
                      className="tool-btn-pill"
                      onClick={handleCancelUpload}
                      title="Cancel Upload"
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.75rem",
                        color: "#ef4444",
                        background: "rgba(239, 68, 68, 0.08)",
                        borderColor: "rgba(239, 68, 68, 0.2)"
                      }}
                    >
                      <FiX size={12} /> Cancel
                    </button>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="tool-progress-track">
                  <div
                    className="tool-progress-fill tool-progress-fill-green"
                    style={{ width: `${Math.max(2, progressData.percent)}%` }}
                  ></div>
                </div>

                {/* Live Real-Time Speed & ETA Stats */}
                <div className="tool-progress-stats-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="tool-status-speed">
                      ⚡ {progressData.speedText || "Uploading..."}
                    </span>
                    <span style={{ color: "var(--tool-gray-400)" }}>•</span>
                    <span className="tool-status-eta">
                      ⏱ {progressData.etaText || "Processing..."}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--tool-gray-500)", fontWeight: 500 }}>
                    {progressData.percent >= 99 ? "Finalizing on Cloudflare Worker..." : "Direct edge stream"}
                  </div>
                </div>
              </div>
            )}

            <div className="tool-btn-actions" style={{ marginTop: 14 }}>
              <button
                className="tool-btn tool-btn-plus-primary"
                onClick={handleUpload}
                disabled={uploadLoading || !file}
              >
                <FiZap size={15} />
                {uploadLoading ? "Uploading…" : "Upload to Edge"}
              </button>

              {uploadLoading ? (
                <button className="tool-btn tool-btn-ghost" onClick={handleCancelUpload}>
                  <FiX size={14} /> Cancel
                </button>
              ) : file ? (
                <button className="tool-btn tool-btn-ghost" onClick={() => setFile(null)}>
                  <FiTrash2 size={14} /> Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* User's Previous Uploads Section */}
          {myUploads.length > 0 && (
            <div className="tool-inner-section">
              <div className="tool-inner-section-header">
                <FiList className="tool-inner-section-icon" />
                <h3 className="tool-inner-section-title">Your Uploads ({myUploads.length})</h3>
                <button
                  className="tool-btn-pill"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setShowMyUploads(v => !v)}
                >
                  {showMyUploads ? "Hide" : "Show"}
                </button>
              </div>

              {showMyUploads && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {myUploads.map(f => (
                    <div
                      key={f.code}
                      className="upd-file-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleDownloadByCode(f.code)}
                    >
                      <div className="upd-file-card-name">
                        <FileIcon filename={f.name} />
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span className="upd-file-card-label">{f.name}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--tool-gray-500)", fontFamily: "monospace" }}>
                            Code: <strong style={{ color: "#10b981" }}>{f.code}</strong> · {formatSize(f.size)}
                          </span>
                        </div>
                      </div>
                      <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="tool-btn-pill"
                          onClick={() => handleDownloadByCode(f.code)}
                          title="Download"
                        >
                          <FiDownload size={12} /> Download
                        </button>
                        <button
                          className="tool-btn-pill"
                          onClick={() => copyToClipboard(f.code, "Code")}
                          title="Copy Code"
                        >
                          <FiCopy size={12} /> Copy
                        </button>
                        <button
                          className="tool-btn-pill tool-btn-pill-danger"
                          onClick={() => removeMyUpload(f.code)}
                          title="Remove from history"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Public Uploads Section */}
          <div className="tool-inner-section">
            <div className="tool-inner-section-header">
              <FiClock className="tool-inner-section-icon" />
              <h3 className="tool-inner-section-title">Recent Public Uploads</h3>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {showRecent && (
                  <button
                    className="tool-btn-pill"
                    onClick={fetchRecentFiles}
                    disabled={recentLoading}
                    title="Refresh list"
                  >
                    <FiRefreshCw size={12} className={recentLoading ? "tool-spin" : ""} />
                  </button>
                )}
                <button className="tool-btn-pill" onClick={toggleRecentFiles}>
                  {showRecent ? "Hide" : "Browse recent"}
                </button>
              </div>
            </div>

            {showRecent && (
              <div style={{ marginTop: 10 }}>
                {recentLoading ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", textAlign: "center", padding: "14px 0" }}>
                    Loading recent uploads…
                  </p>
                ) : recentFiles.length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--tool-gray-500)", textAlign: "center", padding: "14px 0" }}>
                    No public uploads found in this region.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {recentFiles.map(f => (
                      <div
                        key={f.code}
                        className="upd-file-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDownloadByCode(f.code)}
                      >
                        <div className="upd-file-card-name">
                          <FileIcon filename={f.name} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span className="upd-file-card-label" title={f.name}>{f.name}</span>
                            <span style={{ fontSize: "0.72rem", color: "var(--tool-gray-500)" }}>
                              Code: <strong style={{ color: "#10b981", fontFamily: "monospace" }}>{f.code}</strong> · {formatSize(f.size)} · {formatAgo(f.createdAt)} · {formatTimeLeft(f.expiresAt)}
                            </span>
                          </div>
                        </div>
                        <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="tool-btn-pill"
                            onClick={() => handleDownloadByCode(f.code)}
                            title="Download"
                          >
                            <FiDownload size={12} /> Download
                          </button>
                          <button
                            className="tool-btn-pill"
                            onClick={() => copyToClipboard(f.code, "Code")}
                            title="Copy Code"
                          >
                            <FiCopy size={12} /> Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
