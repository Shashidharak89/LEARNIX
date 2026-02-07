// app/components/WordToPdf.jsx
"use client";
import { useState, useEffect } from "react";
import { FiUpload, FiDownload, FiTrash2, FiCopy, FiFile, FiList } from "react-icons/fi";
import "./styles/WordToPdf.css";

export default function FileUploadDownload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "success" or "error"
  const [uploadLoading, setUploadLoading] = useState(false);
  const [downloadId, setDownloadId] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileId, setFileId] = useState("");
  const [persistentFileId, setPersistentFileId] = useState("");
  const [persistentFileName, setPersistentFileName] = useState("");
  const [allFiles, setAllFiles] = useState([]);
  const [showAll, setShowAll] = useState(false);

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

  function showStatus(message, type = "") {
    setStatus(message);
    setStatusType(type);
  }

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      showStatus("");
      setFileId("");
    }
  }

  async function handleUpload() {
    if (!file) {
      showStatus("Please choose a file.", "error");
      return;
    }

    setUploadLoading(true);
    showStatus("Uploading...");

    try {
      const fd = new FormData();
      fd.append("file", file, file.name);

      const res = await fetch("/api/file/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        showStatus(data.error || "Upload failed", "error");
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

      showStatus(`Upload complete! File ID: ${data.fileId}`, "success");
    } catch (err) {
      console.error("Upload error:", err);
      showStatus("Network error or server unavailable. Please try again.", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  async function downloadFile(id) {
    setDownloadLoading(true);
    showStatus("Fetching download link...");

    try {
      const response = await fetch(`/api/file/download/${id}`);
      const data = await response.json();

      if (!response.ok) {
        showStatus(data.error || "Failed to fetch download link", "error");
        return;
      }

      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showStatus("Download initiated successfully!", "success");

    } catch (err) {
      console.error("Download error:", err);
      showStatus("Failed to initiate download. Please try again.", "error");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDownload() {
    if (!downloadId.trim()) {
      showStatus("Please enter a file ID.", "error");
      return;
    }

    downloadFile(downloadId.trim());
    setDownloadId("");
  }

  function clearUpload() {
    setFile(null);
    showStatus("");
    setFileId("");
  }

  function clearDownload() {
    setDownloadId("");
    showStatus("");
  }

  function removeFile(id) {
    const updatedFiles = allFiles.filter(file => file.fileid !== id);
    setAllFiles(updatedFiles);
    localStorage.setItem('userUploadedFiles', JSON.stringify(updatedFiles));
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showStatus("ID copied to clipboard!", "success");
  }

  return (
    <div className="fud-page-container">
      <header className="fud-header" aria-hidden={true}>
        <FiFile className="fud-header-icon" />
      </header>

      <main className="fud-main" role="main">
        {/* Intro Card */}
        <section className="fud-card fud-intro" aria-labelledby="fud-title">
          <div className="fud-tool-number">1.</div>
          <h1 id="fud-title" className="fud-title">File Upload & Download</h1>
          <p className="fud-meta">Free to use • Up to 100MB per file • Files expire after 24 hours</p>
        </section>

        {/* Upload Section */}
        <section className="fud-card" aria-labelledby="fud-upload">
          <div className="fud-section-header">
            <FiUpload className="fud-section-icon" />
            <h2 id="fud-upload" className="fud-subtitle">Upload File</h2>
          </div>

          <div className="fud-tool-body">
            <label className="fud-file-input">
              <FiUpload className="fud-upload-icon" />
              <span className="fud-file-choose">
                {file ? file.name : "Click to choose a file"}
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
              <h2 id="fud-history" className="fud-subtitle">Your Uploaded Files</h2>
            </div>

            {persistentFileId && (
              <div className="fud-last-upload">
                <div className="fud-last-upload-info">
                  <FiFile className="fud-file-icon" />
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
                        <FiFile className="fud-file-icon-sm" />
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

        {/* Download Section */}
        <section className="fud-card" aria-labelledby="fud-download">
          <div className="fud-section-header">
            <FiDownload className="fud-section-icon" />
            <h2 id="fud-download" className="fud-subtitle">Download File by ID</h2>
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

        {/* Status Message */}
        {status && (
          <div className={`fud-status ${statusType === "success" ? "fud-status-success" : statusType === "error" ? "fud-status-error" : ""}`}>
            {status}
          </div>
        )}
      </main>
    </div>
  );
}
