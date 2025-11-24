// app/components/WordToPdf.jsx
"use client";
import { useState, useEffect } from "react";
import { FiUpload, FiDownload, FiTrash2 } from "react-icons/fi";
import "./styles/WordToPdf.css";

export default function FileUploadDownload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [downloadId, setDownloadId] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileId, setFileId] = useState("");
  const [persistentFileId, setPersistentFileId] = useState("");
  const [persistentFileName, setPersistentFileName] = useState("");
  const [allFiles, setAllFiles] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [allFilesLoading, setAllFilesLoading] = useState(false);

  useEffect(() => {
    const storedFileId = localStorage.getItem('uploadedFileId');
    const storedFileName = localStorage.getItem('uploadedFileName');
    if (storedFileId && storedFileName) {
      setPersistentFileId(storedFileId);
      setPersistentFileName(storedFileName);
    }
  }, []);

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
      setPersistentFileId(data.fileId);
      setPersistentFileName(file.name);
      localStorage.setItem('uploadedFileId', data.fileId);
      localStorage.setItem('uploadedFileName', file.name);
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
    setStatus("Fetching download link...");

    try {
      const response = await fetch(`/api/file/download/${downloadId.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Failed to fetch download link");
        return;
      }

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus("Download initiated successfully!");
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

  async function fetchAllFiles() {
    setAllFilesLoading(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) {
        setAllFiles(data.files);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setAllFilesLoading(false);
    }
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

        {persistentFileId && (
          <div className="persistent-info" style={{marginTop: "10px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px"}}>
            <strong>Last Uploaded:</strong> {persistentFileName}
            <div style={{display: "flex", gap: "5px", marginTop: "5px"}}>
              <button className="ilp-btn ghost" style={{fontSize: "small"}} onClick={() => downloadFile(persistentFileId)} disabled={downloadLoading}>
                Download
              </button>
              <button className="ilp-btn ghost" style={{fontSize: "small"}} onClick={() => { navigator.clipboard.writeText(persistentFileId); setStatus("ID copied to clipboard!"); }}>
                Copy ID
              </button>
              <button
                className="ilp-btn ghost"
                onClick={() => {
                  localStorage.removeItem('uploadedFileId');
                  localStorage.removeItem('uploadedFileName');
                  setPersistentFileId("");
                  setPersistentFileName("");
                }}
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          </div>
        )}

        <div style={{marginTop: "10px"}}>
          <button className="ilp-btn ghost" onClick={() => { setShowAll(!showAll); if (!showAll) fetchAllFiles(); }}>
            {showAll ? "Hide" : "See All"} Uploads
          </button>
          {showAll && (
            <div style={{marginTop: "10px", border: "1px solid #ccc", padding: "10px", maxHeight: "200px", overflowY: "auto"}}>
              {allFilesLoading ? <p>Loading...</p> :
                allFiles.length === 0 ? <p>No files uploaded yet.</p> :
                allFiles.map(file => (
                  <div key={file._id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px"}}>
                    <span>{file.originalName}</span>
                    <div style={{display: "flex", gap: "3px"}}>
                      <button className="ilp-btn ghost" style={{fontSize: "small"}} onClick={() => downloadFile(file.fileid)} disabled={downloadLoading}>
                        Download
                      </button>
                      <button className="ilp-btn ghost" style={{fontSize: "small"}} onClick={() => { navigator.clipboard.writeText(file.fileid); setStatus("ID copied to clipboard!"); }}>
                        Copy ID
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
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
