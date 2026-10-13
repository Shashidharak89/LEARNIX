"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit3,
  FiSend,
  FiX,
  FiUser,
  FiLink,
  FiAlertCircle,
  FiCheckCircle,
  FiUploadCloud,
  FiUpload,
  FiEye,
  FiGlobe,
  FiLock,
  FiLink2,
  FiCheck,
  FiInfo
} from "react-icons/fi";
import FileIcon from "../../components/FileIcon";
import { uploadFileViaWebSocket } from "@/lib/websocketUploader";
import "./styles/UpdatesList.css";
import "./styles/AddUpdateForm.css";

export default function AddUpdateForm({ onUpdateAdded, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linksText, setLinksText] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [userId, setUserId] = useState(null);
  const [userUsn, setUserUsn] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const usn = typeof window !== "undefined" ? localStorage.getItem("usn") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (usn) setUserUsn(usn);

    (async () => {
      if (token) {
        try {
          const authRes = await fetch("/api/auth/verify-token", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData?.user?._id) {
              setUserId(authData.user._id);
              if (authData.user.usn) setUserUsn(authData.user.usn);
              return;
            }
          }
        } catch (e) {
          console.error("Token verification error:", e);
        }
      }

      if (usn) {
        try {
          const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.userId) setUserId(data.userId);
          }
        } catch (err) {
          console.error("Failed to resolve user id", err);
        }
      }
    })();
  }, []);

  const toastTimeoutRef = useRef(null);
  const showToast = (msg, type = "info") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const parseLinks = (text) => {
    if (!text) return [];
    return text
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingFiles(true);
    setUploadStatus({
      current: 1,
      total: files.length,
      filename: files[0]?.name,
      percent: 0,
      chunkIndex: 1,
      totalChunks: 1,
      statusText: "Connecting to WebSocket..."
    });

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadStatus({
          current: i + 1,
          total: files.length,
          filename: f.name,
          percent: 0,
          chunkIndex: 1,
          totalChunks: 1,
          statusText: "Connecting to WebSocket..."
        });

        const uploadResult = await uploadFileViaWebSocket(f, {
          userId,
          token,
          onProgress: ({ percent, currentChunk, totalChunks, statusText }) => {
            const formattedStatus = statusText || `${percent}% uploaded`;
            setUploadStatus({
              current: i + 1,
              total: files.length,
              filename: f.name,
              percent,
              chunkIndex: currentChunk,
              totalChunks,
              statusText: formattedStatus
            });
          },
          onStatus: (statusText) => {
            setUploadStatus(prev => prev ? ({ ...prev, statusText }) : null);
          }
        });

        const uploadedFile = uploadResult?.file;
        if (uploadedFile) {
          setUploadedFiles((p) => [...p, uploadedFile]);
        } else {
          showToast(`Failed to upload ${f.name}`, "error");
        }
      }
      showToast(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""} successfully via WebSocket`, "success");
    } catch (err) {
      console.error("File upload error", err);
      showToast(err.message || "File upload failed. Please try again.", "error");
    } finally {
      setIsUploadingFiles(false);
      setUploadStatus(null);
      if (e?.target) e.target.value = null;
    }
  };

  const removeUploadedFile = async (idx) => {
    const fileToRemove = uploadedFiles[idx];
    setUploadedFiles((p) => p.filter((_, i) => i !== idx));

    if (fileToRemove?.publicId) {
      try {
        await fetch("/api/updates/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: fileToRemove.publicId,
            resourceType: fileToRemove.resourceType || "auto",
          }),
        });
      } catch (err) {
        console.error("Failed to delete uncommitted file from Cloudinary:", err);
      }
    }
  };

  const handleClear = () => {
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((f) => {
        if (f.publicId) {
          fetch("/api/updates/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              publicId: f.publicId,
              resourceType: f.resourceType || "auto",
            }),
          }).catch(console.error);
        }
      });
      showToast("Cleared form and removed uploaded files", "info");
    }
    setTitle("");
    setContent("");
    setLinksText("");
    setUploadedFiles([]);
    setVisibility("public");
  };

  const handleCancelClick = () => {
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((f) => {
        if (f.publicId) {
          fetch("/api/updates/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              publicId: f.publicId,
              resourceType: f.resourceType || "auto",
            }),
          }).catch(console.error);
        }
      });
    }
    if (onCancel) onCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast("Please enter title and content", "error");
      return;
    }

    if (isUploadingFiles) {
      showToast("Please wait until files finish uploading", "info");
      return;
    }

    setLoading(true);
    const links = parseLinks(linksText);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          links,
          userId,
          files: uploadedFiles,
          visibility
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Update created successfully", "success");
        setTitle("");
        setContent("");
        setLinksText("");
        setUploadedFiles([]);
        setVisibility("public");
        if (onUpdateAdded) onUpdateAdded();
      } else {
        showToast(data?.error || "Failed to create update", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const linksCount = parseLinks(linksText).length;

  return (
    <div className="auf-container">
      {/* Header */}
      <div className="auf-header">
        <div className="auf-header-left">
          <div className="auf-header-icon-box">
            <FiEdit3 />
          </div>
          <div>
            <h3 className="auf-header-title">Create Campus Update</h3>
            <p className="auf-header-subtitle">Publish announcements, notes, or resources for your campus</p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={handleCancelClick}
            className="auf-close-header-btn"
            title="Collapse Form"
            aria-label="Close add update form"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Floating Screen-Bottom Toast Notification */}
      {toast && (
        <div className={`auf-toast auf-toast-${toast.type || "info"}`} role="status" aria-live="polite">
          <div className="auf-toast-icon-box">
            {toast.type === "success" ? (
              <FiCheckCircle className="auf-toast-icon" />
            ) : toast.type === "error" ? (
              <FiAlertCircle className="auf-toast-icon" />
            ) : (
              <FiInfo className="auf-toast-icon" />
            )}
          </div>
          <span className="auf-toast-text">{toast.message}</span>
          <button
            type="button"
            className="auf-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="auf-card">
        <form onSubmit={handleSubmit} className="auf-form">
          {/* Section 1: Title Field */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <FiEdit3 className="auf-label-icon" />
                <span>Title</span>
                <span className="auf-required">*</span>
              </label>
              <span className="auf-char-count">{title.length} characters</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule for Mid-Term Exams & Revision Materials"
              className="auf-input"
              required
            />
          </div>

          {/* Section 2: Visibility Selector (Apple-style Segmented Pills) */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <FiEye className="auf-label-icon" />
                <span>Visibility Level</span>
              </label>
            </div>
            <div className="auf-vis-segmented">
              <button
                type="button"
                className={`auf-vis-option ${visibility === "public" ? "active auf-vis-public" : ""}`}
                onClick={() => setVisibility("public")}
              >
                <div className="auf-vis-icon-circle">
                  <FiGlobe />
                </div>
                <div className="auf-vis-text-box">
                  <span className="auf-vis-title">Public</span>
                  <span className="auf-vis-desc">Campus feed</span>
                </div>
                {visibility === "public" && <FiCheck className="auf-vis-check" />}
              </button>

              <button
                type="button"
                className={`auf-vis-option ${visibility === "unlisted" ? "active auf-vis-unlisted" : ""}`}
                onClick={() => setVisibility("unlisted")}
              >
                <div className="auf-vis-icon-circle">
                  <FiLink2 />
                </div>
                <div className="auf-vis-text-box">
                  <span className="auf-vis-title">Unlisted</span>
                  <span className="auf-vis-desc">Anyone with link</span>
                </div>
                {visibility === "unlisted" && <FiCheck className="auf-vis-check" />}
              </button>

              <button
                type="button"
                className={`auf-vis-option ${visibility === "private" ? "active auf-vis-private" : ""}`}
                onClick={() => setVisibility("private")}
              >
                <div className="auf-vis-icon-circle">
                  <FiLock />
                </div>
                <div className="auf-vis-text-box">
                  <span className="auf-vis-title">Private</span>
                  <span className="auf-vis-desc">Only you</span>
                </div>
                {visibility === "private" && <FiCheck className="auf-vis-check" />}
              </button>
            </div>
          </div>

          {/* Section 3: Content Field */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <FiEdit3 className="auf-label-icon" />
                <span>Content</span>
                <span className="auf-required">*</span>
              </label>
              <span className="auf-char-count">{content.length} characters</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write update details, notes, links, or instructions..."
              rows={5}
              className="auf-textarea"
              required
            />
            <div className="auf-hint">
              Markdown formatting and multi-line breaks are supported
            </div>
          </div>

          {/* Section 4: Links Field */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <FiLink className="auf-label-icon" />
                <span>Links & References (optional)</span>
              </label>
              {linksCount > 0 && (
                <span className="auf-badge-count">{linksCount} {linksCount === 1 ? "link" : "links"}</span>
              )}
            </div>
            <textarea
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder="/pyqs/cs or https://drive.google.com/... (one per line or separated by commas)"
              rows={2}
              className="auf-textarea auf-textarea-links"
            />
            <div className="auf-hint">
              Add internal links (starting with /) or external URLs (https://)
            </div>
          </div>

          {/* Section 5: Files (optional) - Exact same UI & logic as Edit Update */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <FiUploadCloud className="auf-label-icon" />
                <span>Files (optional)</span>
              </label>
              {uploadedFiles && uploadedFiles.length > 0 && (
                <span className="upl-edit-file-count">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? "file" : "files"} attached
                </span>
              )}
            </div>

            <div className="upl-edit-files-row">
              <label className="upl-file-btn">
                <FiUpload />
                <span>Add files</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFilesSelected}
                  className="upl-hidden-input"
                />
              </label>
              {isUploadingFiles && !uploadStatus && (
                <span className="upl-file-uploading">Uploading…</span>
              )}
            </div>

            {/* Upload Progressbar */}
            {isUploadingFiles && uploadStatus && (
              <div className="upl-ws-progress-box">
                <div className="upl-ws-progress-header">
                  <span className="upl-ws-progress-filename" title={uploadStatus.filename}>
                    <strong>{uploadStatus.filename}</strong>
                    {uploadStatus.total > 1 && ` (File ${uploadStatus.current}/${uploadStatus.total})`}
                  </span>
                  <span className="upl-ws-progress-tag">
                    {uploadStatus.percent || 0}% uploaded
                  </span>
                </div>
                <div className="upl-ws-progress-track">
                  <div
                    className="upl-ws-progress-fill"
                    style={{ width: `${Math.max(2, uploadStatus.percent || 0)}%` }}
                  ></div>
                </div>
                {uploadStatus.statusText && !uploadStatus.statusText.includes(`${uploadStatus.percent || 0}% uploaded`) && (
                  <div className="upl-ws-progress-footer">
                    <span className="upl-ws-progress-status-text">
                      {uploadStatus.statusText}
                    </span>
                  </div>
                )}
              </div>
            )}

            {uploadedFiles && uploadedFiles.length > 0 && (
              <div className="upl-edit-files-list">
                {uploadedFiles.map((f, i) => {
                  const url = f.url || f;
                  const name = f.name || (typeof url === "string" ? url.split("/").pop() : "Attachment");
                  const viewUrl = typeof url === "string" && url.startsWith("http")
                    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
                    : url;

                  return (
                    <div key={i} className="upl-edit-file-item">
                      <div className="upl-edit-file-info">
                        <FileIcon filename={name} />
                        <a
                          href={viewUrl}
                          className="upl-edit-file-link"
                          target="_blank"
                          rel="noreferrer noopener"
                          title={name}
                        >
                          {name}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="upl-edit-file-remove"
                        onClick={() => removeUploadedFile(i)}
                        title="Remove file"
                      >
                        <FiX />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="auf-actions">
            <div className="auf-user-status">
              <div className="auf-status-avatar">
                <FiUser />
              </div>
              <div className="auf-status-text">
                <span className="auf-status-label">Posting as</span>
                <span className={userId ? "auf-status-active" : "auf-status-inactive"}>
                  {userUsn ? userUsn : userId ? "Authenticated User" : "Anonymous"}
                </span>
              </div>
            </div>

            <div className="auf-buttons">
              {onCancel ? (
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="auf-btn auf-btn-clear"
                  disabled={loading || isUploadingFiles}
                >
                  <FiX />
                  <span>Cancel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClear}
                  className="auf-btn auf-btn-clear"
                  disabled={loading || isUploadingFiles}
                >
                  <FiX />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="submit"
                className="auf-btn auf-btn-submit"
                disabled={loading || isUploadingFiles}
              >
                {loading ? (
                  <>
                    <span className="auf-spinner"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>Publish Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}