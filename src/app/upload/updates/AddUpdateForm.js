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
  FiImage,
  FiTrash2,
  FiUploadCloud,
  FiEye,
  FiGlobe,
  FiLock,
  FiLink2,
  FiFileText,
  FiFile,
  FiFilm,
  FiExternalLink,
  FiCheck,
  FiPaperclip,
  FiPlus,
  FiInfo
} from "react-icons/fi";
import "./styles/AddUpdateForm.css";

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return null;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileCategory = (file) => {
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  const resType = file.resourceType;
  if (resType === "image" || ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) {
    return "image";
  }
  if (["mp4", "mov", "webm", "mkv", "avi"].includes(ext) || resType === "video") {
    return "video";
  }
  if (["pdf", "doc", "docx", "txt", "rtf", "odt", "md"].includes(ext)) {
    return "doc";
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return "sheet";
  }
  return "file";
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const usn = typeof window !== "undefined" ? localStorage.getItem("usn") : null;
    if (!usn) return;
    setUserUsn(usn);

    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.userId) setUserId(data.userId);
        }
      } catch (err) {
        console.error("Failed to resolve user id", err);
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

  const uploadFilesBatch = async (files) => {
    if (!files || !files.length) return;

    // Filter large files (>50MB)
    const validFiles = [];
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) {
        showToast(`"${f.name}" exceeds the 50MB limit`, "error");
      } else {
        validFiles.push(f);
      }
    }
    if (!validFiles.length) return;

    setIsUploadingFiles(true);
    setUploadStatus({ current: 1, total: validFiles.length, filename: validFiles[0]?.name });

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const f = validFiles[i];
        setUploadStatus({ current: i + 1, total: validFiles.length, filename: f.name });
        const fd = new FormData();
        fd.append("file", f);
        if (userId) fd.append("userId", userId);

        const res = await fetch("/api/updates/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (res.ok && data?.file) {
          setUploadedFiles((prev) => [...prev, { ...data.file, size: f.size }]);
        } else {
          showToast(data?.error || `Failed to upload ${f.name}`, "error");
        }
      }
      showToast(`Uploaded ${validFiles.length} file${validFiles.length > 1 ? "s" : ""} successfully`, "success");
    } catch (err) {
      console.error("File upload error", err);
      showToast("File upload failed. Please try again.", "error");
    } finally {
      setIsUploadingFiles(false);
      setUploadStatus(null);
    }
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      uploadFilesBatch(files);
    }
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      uploadFilesBatch(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const removeUploadedFile = (idx) => {
    setUploadedFiles((p) => p.filter((_, i) => i !== idx));
  };

  const handleClear = () => {
    setTitle("");
    setContent("");
    setLinksText("");
    setUploadedFiles([]);
    setVisibility("public");
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

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        handleClear();
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
            onClick={onCancel}
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

          {/* Section 5: File Upload Section (LAST FIELD - Redesigned with Apple Theme + Drag & Drop) */}
          <div className="auf-field auf-file-upload-section">
            <div className="auf-label-row">
              <label className="auf-label">
                <FiUploadCloud className="auf-label-icon" />
                <span>Attachments & Media (optional)</span>
              </label>
              {uploadedFiles.length > 0 && (
                <span className="auf-badge-count auf-badge-files">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? "file" : "files"}
                </span>
              )}
            </div>

            {/* Apple Theme Drag & Drop Dropzone */}
            <div
              className={`auf-dropzone ${isDragging ? "auf-dropzone-dragging" : ""} ${
                isUploadingFiles ? "auf-dropzone-uploading" : ""
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesSelected}
                className="auf-hidden-input"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              />

              <div className="auf-dropzone-icon-box">
                <FiUploadCloud className="auf-dropzone-icon" />
              </div>

              <div className="auf-dropzone-text-group">
                <p className="auf-dropzone-title">
                  {isDragging ? (
                    <span className="auf-dropzone-highlight">Drop files here to attach</span>
                  ) : (
                    <>
                      Drag & drop files here, or <span className="auf-dropzone-browse">browse</span>
                    </>
                  )}
                </p>
                <p className="auf-dropzone-sub">
                  Supports images, documents, PDFs, and spreadsheets up to 50MB each
                </p>
              </div>
            </div>

            {/* Uploading progress notification card */}
            {isUploadingFiles && uploadStatus && (
              <div className="auf-uploading-banner">
                <div className="auf-uploading-left">
                  <span className="auf-spinner auf-spinner-blue"></span>
                  <div className="auf-uploading-info">
                    <span className="auf-uploading-text">
                      Uploading {uploadStatus.current} of {uploadStatus.total}...
                    </span>
                    <span className="auf-uploading-filename">{uploadStatus.filename}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Files Gallery */}
            {uploadedFiles.length > 0 && (
              <div className="auf-files-grid">
                {uploadedFiles.map((f, i) => {
                  const cat = getFileCategory(f);
                  const isImg = cat === "image";

                  return (
                    <div key={i} className="auf-file-card">
                      <div className="auf-file-preview">
                        {isImg ? (
                          <img src={f.url} alt={f.name || "upload"} className="auf-file-img" />
                        ) : cat === "video" ? (
                          <div className="auf-file-icon-box auf-file-icon-video">
                            <FiFilm />
                          </div>
                        ) : cat === "doc" ? (
                          <div className="auf-file-icon-box auf-file-icon-doc">
                            <FiFileText />
                          </div>
                        ) : (
                          <div className="auf-file-icon-box auf-file-icon-generic">
                            <FiFile />
                          </div>
                        )}
                      </div>

                      <div className="auf-file-meta">
                        <span className="auf-file-title" title={f.name || f.url}>
                          {f.name || "Attached File"}
                        </span>
                        <div className="auf-file-sub-info">
                          <span className="auf-file-ext-pill">
                            {(f.name?.split(".").pop() || f.resourceType || "file").toUpperCase()}
                          </span>
                          {f.size ? (
                            <span className="auf-file-size">{formatBytes(f.size)}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="auf-file-card-actions">
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="auf-file-action-btn auf-file-action-view"
                          title="View / Preview file"
                          aria-label="View file"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiExternalLink />
                        </a>
                        <button
                          type="button"
                          className="auf-file-action-btn auf-file-action-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedFile(i);
                          }}
                          title="Remove file"
                          aria-label="Remove file"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
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
                  onClick={onCancel}
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