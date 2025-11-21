// app/components/WordToPdf.jsx
"use client";
import { useState } from "react";
import { FiUpload, FiDownload, FiTrash2 } from "react-icons/fi";
import "./styles/WordToPdf.css";

export default function FileUploadDownload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [downloadId, setDownloadId] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileId, setFileId] = useState("");

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus("");
      setFileId("");
    }
  }

  async function handleUpload() {
    if (!file) {
      setStatus("Please choose a file.");
      return;
    }

    setUploadLoading(true);
    setStatus("Uploading...");

    try {
      const fd = new FormData();
      fd.append("file", file, file.name);

      const res = await fetch("/api/file/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Upload failed");
        return;
      }

      setFileId(data.fileId);
      setStatus(`Upload complete! File ID: ${data.fileId}`);
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("Network error or server unavailable. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleDownload() {
    if (!downloadId.trim()) {
      setStatus("Please enter a file ID.");
      return;
    }

    setDownloadLoading(true);
    setStatus("");

    try {
      // Redirect to the download URL
      window.open(`/api/file/download/${downloadId.trim()}`, "_blank");
      setStatus("Download initiated. Check your downloads.");
      setDownloadId("");
    } catch (err) {
      console.error("Download error:", err);
      setStatus("Failed to initiate download. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  }

  function clearUpload() {
    setFile(null);
    setStatus("");
    setFileId("");
  }

  function clearDownload() {
    setDownloadId("");
    setStatus("");
  }

  return (
    <div className="ilp-container">
      {/* Upload Section */}
      <div className="upload-section">
        <h2 className="ilp-title">Upload File</h2>

        <label className="ilp-dropzone">
          <input type="file" accept="*" onChange={onFileChange} />
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
                  <div>Select or drop any file</div>
                  <div className="ilp-sub">Up to 100MB</div>
                </div>
              )}
            </div>
          </div>
        </label>

        <div className="ilp-actions">
          <button className="ilp-btn primary" onClick={handleUpload} disabled={uploadLoading}>
            {uploadLoading ? "Uploading..." : "Upload"}
          </button>
          <button className="ilp-btn ghost" onClick={clearUpload}>
            <FiTrash2 /> Clear
          </button>
        </div>

        {fileId && (
          <div className="file-id">
            <strong>File ID:</strong> {fileId}
          </div>
        )}
      </div>

      <hr style={{margin: "20px 0"}} />

      {/* Download Section */}
      <div className="download-section">
        <h2 className="ilp-title">Download File by ID</h2>

        <div className="download-input">
          <input
            type="text"
            placeholder="Enter file ID to download"
            value={downloadId}
            onChange={(e) => setDownloadId(e.target.value)}
            className="id-input"
          />
        </div>

        <div className="ilp-actions">
          <button className="ilp-btn primary" onClick={handleDownload} disabled={downloadLoading}>
            {downloadLoading ? "Downloading..." : "Download"}
            <FiDownload style={{marginLeft: "8px"}} />
          </button>
          <button className="ilp-btn ghost" onClick={clearDownload}>
            Clear
          </button>
        </div>
      </div>

      <div className="ilp-status">{status}</div>

      <div className="ilp-note">
        <small>Files are stored securely in Cloudinary. Download using the File ID.</small>
      </div>
    </div>
  );
}
