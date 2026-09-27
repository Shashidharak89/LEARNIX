// app/components/WordToPdf.jsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { FiUpload, FiDownload, FiTrash2, FiCopy, FiFile, FiList, FiFileText, FiCloud, FiCheckCircle, FiStar, FiAlertCircle, FiInfo, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import "./styles/WordToPdf.css";
import "./styles/ToolsPage.css";

export default function FileUploadDownload() {
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Toast notification state
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const storedFileId = localStorage.getItem('uploadedFileId');
    const storedFileName = localStorage.getItem('uploadedFileName');
    if (storedFileId && storedFileName) {
      setPersistentFileId(storedFileId);
      setPersistentFileName(storedFileName);
    }

    const userFiles = JSON.parse(localStorage.getItem('userUploadedFiles') || '[]');
    setAllFiles(userFiles);
  }, []);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Dismiss toast manually
  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  // Get toast icon based on type
  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiAlertCircle />;
      default:
        return <FiInfo />;
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      showToast(`File "${droppedFile.name}" ready to upload!`, "success");
      setFileId("");
      e.dataTransfer.clearData();
    }
  }, [showToast]);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileId("");
    }
  }

  async function handleUpload() {
    if (!file) {
      showToast("Please choose a file.", "error");
      return;
    }

    setUploadLoading(true);
    showToast("Uploading...", "info");

    try {
      const fd = new FormData();
      fd.append("file", file, file.name);

      const res = await fetch("/api/file/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }

      setFileId(data.fileId);
      setPersistentFileId(data.fileId);
      setPersistentFileName(file.name);
      localStorage.setItem('uploadedFileId', data.fileId);
      localStorage.setItem('uploadedFileName', file.name);

      const userFiles = JSON.parse(localStorage.getItem('userUploadedFiles') || '[]');
      const newFile = { fileid: data.fileId, originalName: file.name };
      const updatedFiles = [newFile, ...userFiles];
      localStorage.setItem('userUploadedFiles', JSON.stringify(updatedFiles));
      setAllFiles(updatedFiles);

      showToast(`Upload complete! File ID: ${data.fileId}`, "success");
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Network error or server unavailable. Please try again.", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  async function downloadFile(id) {
    setDownloadLoading(true);
    showToast("Fetching download link...", "info");

    try {
      const response = await fetch(`/api/file/download/${id}`);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Failed to fetch download link", "error");
        return;
      }

      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Download initiated successfully!", "success");

    } catch (err) {
      console.error("Download error:", err);
      showToast("Failed to initiate download. Please try again.", "error");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDownload() {
    if (!downloadId.trim()) {
      showToast("Please enter a file ID.", "error");
      return;
    }

    downloadFile(downloadId.trim());
    setDownloadId("");
  }

  function clearUpload() {
    setFile(null);
    setFileId("");
  }

  function clearDownload() {
    setDownloadId("");
  }

  function removeFile(id) {
    const updatedFiles = allFiles.filter(file => file.fileid !== id);
    setAllFiles(updatedFiles);
    localStorage.setItem('userUploadedFiles', JSON.stringify(updatedFiles));
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast("ID copied to clipboard!", "success");
  }

  return (
    <div 
      className={`tool-card ${isExpanded ? 'tool-card-expanded' : 'tool-card-collapsed'} ${isDragging ? 'fud-dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toast Notification */}
      {toast && (
        <div className={`fud-toast fud-toast-${toast.type}`}>
          <div className="fud-toast-icon">
            {getToastIcon(toast.type)}
          </div>
          <span className="fud-toast-message">{toast.message}</span>
          <button className="fud-toast-close" onClick={dismissToast}>
            <FiX />
          </button>
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="fud-drag-overlay">
          <div className="fud-drop-zone">
            <div className="fud-drag-icon-wrapper">
              <FiUpload className="fud-drag-overlay-icon" />
            </div>
            <h3 className="fud-drag-overlay-text">Drop your file here</h3>
            <p className="fud-drag-overlay-hint">Release to upload instantly</p>
          </div>
        </div>
      )}

      {/* Collapsed Header / Always Visible Row */}
      <div 
        className="tool-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="tool-card-header-left">
          <span className="tool-card-toggle-icon">
            {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          </span>
          <div className="tool-card-title-container">
            <h2 className="tool-card-title">File Upload</h2>
            <span className="tool-card-subtitle">Upload files or enter code to download</span>
          </div>
        </div>

        <div 
          className="tool-card-header-inline"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Enter code to download file"
            value={downloadId}
            onChange={(e) => setDownloadId(e.target.value)}
            className="tool-card-inline-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleDownload();
              }
            }}
          />
          <button 
            className="tool-card-inline-btn"
            onClick={handleDownload}
            disabled={downloadLoading || !downloadId.trim()}
          >
            <FiDownload size={15} />
            <span>{downloadLoading ? "Downloading..." : "Download"}</span>
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="tool-card-body">
          <main className="fud-main" role="main">
            {/* Upload Section */}
            <section className="fud-card" aria-labelledby="fud-upload">
              <div className="fud-section-header">
                <FiUpload className="fud-section-icon" />
                <h3 id="fud-upload" className="fud-subtitle">Upload File</h3>
              </div>

              <div className="fud-tool-body">
                <label className="fud-file-input">
                  <FiUpload className="fud-upload-icon" />
                  <span className="fud-file-choose">
                    {file ? file.name : "Click to choose a file or drag & drop"}
                  </span>
                  {file ? (
                    <span className="fud-file-hint">{Math.round(file.size / 1024)} KB</span>
                  ) : (
                    <span className="fud-file-hint">Supports all file types • Up to 100MB</span>
                  )}
                  <input type="file" accept="*" onChange={onFileChange} />
                </label>

                <div className="fud-actions">
                  <button className="fud-btn fud-btn-primary" onClick={handleUpload} disabled={uploadLoading || !file}>
                    <FiUpload className="fud-btn-icon" />
                    {uploadLoading ? "Uploading..." : "Upload File"}
                  </button>
                  <button className="fud-btn fud-btn-ghost" onClick={clearUpload} disabled={uploadLoading}>
                    <FiTrash2 className="fud-btn-icon" />
                    Clear
                  </button>
                </div>

                {fileId && (
                  <div className="fud-file-id-box">
                    <strong>File ID:</strong>
                    <code className="fud-file-id-code">{fileId}</code>
                    <button className="fud-btn-mini" onClick={() => copyToClipboard(fileId)}>
                      <FiCopy /> Copy
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Last Uploaded / All Files Section */}
            {(persistentFileId || allFiles.length > 0) && (
              <section className="fud-card" aria-labelledby="fud-history">
                <div className="fud-section-header">
                  <FiList className="fud-section-icon" />
                  <h3 id="fud-history" className="fud-subtitle">Your Uploaded Files</h3>
                </div>

                {persistentFileId && (
                  <div className="fud-last-upload">
                    <div className="fud-last-upload-info">
                      <div>
                        <strong>{persistentFileName}</strong>
                        <span className="fud-meta">Last uploaded</span>
                      </div>
                    </div>
                    <div className="fud-last-upload-actions">
                      <button className="fud-btn-mini" onClick={() => downloadFile(persistentFileId)} disabled={downloadLoading}>
                        <FiDownload /> Download
                      </button>
                      <button className="fud-btn-mini" onClick={() => copyToClipboard(persistentFileId)}>
                        <FiCopy /> Copy ID
                      </button>
                      <button
                        className="fud-btn-mini fud-btn-danger"
                        onClick={() => {
                          localStorage.removeItem('uploadedFileId');
                          localStorage.removeItem('uploadedFileName');
                          setPersistentFileId("");
                          setPersistentFileName("");
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                )}

                <button className="fud-btn fud-btn-ghost fud-btn-full" onClick={() => setShowAll(!showAll)}>
                  <FiList className="fud-btn-icon" />
                  {showAll ? "Hide" : "Show"} All Uploads ({allFiles.length})
                </button>

                {showAll && (
                  <div className="fud-files-list">
                    {allFiles.length === 0 ? (
                      <p className="fud-empty">No files uploaded yet.</p>
                    ) : (
                      allFiles.map(f => (
                        <div key={f.fileid} className="fud-file-item">
                          <div className="fud-file-item-info">
                            <span className="fud-file-name">{f.originalName}</span>
                          </div>
                          <div className="fud-file-item-actions">
                            <button className="fud-btn-mini" onClick={() => downloadFile(f.fileid)} disabled={downloadLoading}>
                              <FiDownload />
                            </button>
                            <button className="fud-btn-mini" onClick={() => copyToClipboard(f.fileid)}>
                              <FiCopy />
                            </button>
                            <button className="fud-btn-mini fud-btn-danger" onClick={() => removeFile(f.fileid)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Download Section inside expanded view */}
            <section className="fud-card" aria-labelledby="fud-download">
              <div className="fud-section-header">
                <FiDownload className="fud-section-icon" />
                <h3 id="fud-download" className="fud-subtitle">Download File by ID</h3>
              </div>

              <div className="fud-tool-body">
                <input
                  type="text"
                  placeholder="Enter file ID to download"
                  value={downloadId}
                  onChange={(e) => setDownloadId(e.target.value)}
                  className="fud-text-input"
                />

                <div className="fud-actions">
                  <button className="fud-btn fud-btn-primary" onClick={handleDownload} disabled={downloadLoading || !downloadId.trim()}>
                    <FiDownload className="fud-btn-icon" />
                    {downloadLoading ? "Downloading..." : "Download"}
                  </button>
                  <button className="fud-btn fud-btn-ghost" onClick={clearDownload}>
                    Clear
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
