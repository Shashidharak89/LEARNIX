"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import {
  PencilIcon,
  SendIcon,
  XIcon,
  LinkIcon,
  EyeIcon,
  GlobeIcon,
  LockIcon,
  CheckIcon,
  Trash2Icon,
  UploadIcon,
  FileTextIcon,
} from "@animateicons/react/lucide";
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
  const [isDragging, setIsDragging] = useState(false);

  // Animated icon refs
  const closeIconRef = useRef(null);
  const sendIconRef = useRef(null);
  const uploadIconRef = useRef(null);

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

  const processFileList = async (files) => {
    if (!files || !files.length) return;
    setIsUploadingFiles(true);
    setUploadStatus({
      current: 1,
      total: files.length,
      filename: files[0].name,
      percent: 0,
      statusText: "Preparing upload..."
    });

    const newFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus({
        current: i + 1,
        total: files.length,
        filename: file.name,
        percent: 0,
        statusText: `Uploading ${file.name}...`
      });

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const currentUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

        const uploadResult = await uploadFileViaWebSocket(file, {
          userId: currentUserId,
          token,
          onProgress: (progress) => {
            setUploadStatus({
              current: i + 1,
              total: files.length,
              filename: file.name,
              percent: progress.percent,
              statusText: progress.statusText || `${progress.percent}% uploaded`
            });
          }
        });

        const uploadedFile = uploadResult?.file || (uploadResult?.url ? uploadResult : null);
        if (uploadedFile) {
          newFiles.push(uploadedFile);
        } else {
          throw new Error("No file object returned from WebSocket upload");
        }
      } catch (err) {
        console.warn(`WebSocket upload failed for ${file.name}, trying HTTP POST:`, err);
        setUploadStatus({
          current: i + 1,
          total: files.length,
          filename: file.name,
          percent: 50,
          statusText: `Retrying upload via standard connection...`
        });

        try {
          const formData = new FormData();
          formData.append("file", file);
          if (userId) formData.append("userId", userId);

          const res = await fetch("/api/updates/upload", {
            method: "POST",
            body: formData
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
          }

          const data = await res.json();
          if (data?.file) {
            newFiles.push(data.file);
          } else {
            throw new Error("No file object returned from server");
          }
        } catch (httpErr) {
          console.error(`HTTP upload also failed for ${file.name}:`, httpErr);
          showToast(`Failed to upload ${file.name}`, "error");
        }
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      showToast(
        newFiles.length === 1
          ? `Uploaded "${newFiles[0].name}" successfully`
          : `Uploaded ${newFiles.length} files successfully`,
        "success"
      );
    }

    setIsUploadingFiles(false);
    setUploadStatus(null);
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await processFileList(files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      await processFileList(files);
    }
  };

  const removeUploadedFile = async (index) => {
    const fileToRemove = uploadedFiles[index];
    if (!fileToRemove) return;

    setUploadedFiles(prev => prev.filter((_, i) => i !== index));

    try {
      await fetch("/api/updates/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: fileToRemove.publicId,
          resourceType: fileToRemove.resourceType || "raw"
        })
      });
    } catch (e) {
      console.error("Failed to delete removed file from server:", e);
    }
  };

  const handleClear = () => {
    setTitle("");
    setContent("");
    setLinksText("");
    setVisibility("public");
    setUploadedFiles([]);
  };

  const handleCancelClick = () => {
    handleClear();
    if (onCancel) onCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUploadingFiles) {
      showToast("Please wait for file upload to finish before saving", "info");
      return;
    }

    if (!title.trim()) {
      showToast("Please enter an update title", "error");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const finalUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

    if (!finalUserId && !token) {
      showToast("You must be logged in to post an update", "error");
      return;
    }

    setLoading(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/updates", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          links: parseLinks(linksText),
          visibility,
          userId: finalUserId,
          files: uploadedFiles
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create update");
      }

      handleClear();
      if (onUpdateAdded) {
        onUpdateAdded(data.update);
      }
    } catch (err) {
      console.error("Add update error:", err);
      showToast(err.message || "Failed to add update", "error");
    } finally {
      setLoading(false);
    }
  };

  const linksCount = parseLinks(linksText).length;

  return (
    <div className="auf-container">
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
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Form Card (Apple Container with integrated Header & right-aligned X) */}
      <div className="auf-card">
        {/* Card Header: Add Update Title + Right Corner X Close Button */}
        <div className="auf-card-header">
          <h2 className="auf-card-title">Add Update</h2>

          {onCancel && (
            <button
              type="button"
              onClick={handleCancelClick}
              className="auf-card-close-btn"
              title="Close"
              aria-label="Close add update form"
              onMouseEnter={() => closeIconRef.current?.startAnimation?.()}
              onMouseLeave={() => closeIconRef.current?.stopAnimation?.()}
            >
              <XIcon ref={closeIconRef} size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auf-form">
          {/* Section 1: Title Field */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <PencilIcon size={15} className="auf-label-icon" />
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
                <EyeIcon size={15} className="auf-label-icon" />
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
                  <GlobeIcon size={16} />
                </div>
                <div className="auf-vis-text-box">
                  <span className="auf-vis-title">Public</span>
                  <span className="auf-vis-desc">Campus feed</span>
                </div>
                {visibility === "public" && <CheckIcon size={16} className="auf-vis-check" />}
              </button>

              <button
                type="button"
                className={`auf-vis-option ${visibility === "unlisted" ? "active auf-vis-unlisted" : ""}`}
                onClick={() => setVisibility("unlisted")}
              >
                <div className="auf-vis-icon-circle">
                  <LinkIcon size={16} />
                </div>
                <div className="auf-vis-text-box">
                  <span className="auf-vis-title">Unlisted</span>
                  <span className="auf-vis-desc">Anyone with link</span>
                </div>
                {visibility === "unlisted" && <CheckIcon size={16} className="auf-vis-check" />}
              </button>

              <button
                type="button"
                className={`auf-vis-option ${visibility === "private" ? "active auf-vis-private" : ""}`}
                onClick={() => setVisibility("private")}
              >
                <div className="auf-vis-icon-circle">
                  <LockIcon size={16} />
                </div>
                <div className="auf-vis-text-box">
                  <span className="auf-vis-title">Private</span>
                  <span className="auf-vis-desc">Only you</span>
                </div>
                {visibility === "private" && <CheckIcon size={16} className="auf-vis-check" />}
              </button>
            </div>
          </div>

          {/* Section 3: Content Field (Optional) */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <FileTextIcon size={15} className="auf-label-icon" />
                <span>Content (optional)</span>
              </label>
              <span className="auf-char-count">{content.length} characters</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write update details, notes, links, or instructions... (optional)"
              rows={4}
              className="auf-textarea"
            />
            <div className="auf-hint">
              Markdown formatting and multi-line breaks are supported
            </div>
          </div>

          {/* Section 4: Links Field */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <LinkIcon size={15} className="auf-label-icon" />
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

          {/* Section 5: Files with Broader Drag and Drop Dropzone */}
          <div className="auf-field">
            <div className="auf-label-row">
              <label className="auf-label">
                <UploadIcon size={15} className="auf-label-icon" />
                <span>Files & Attachments (optional)</span>
              </label>
              {uploadedFiles && uploadedFiles.length > 0 && (
                <span className="upl-edit-file-count">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? "file" : "files"} attached
                </span>
              )}
            </div>

            {/* Broader Drag & Drop Dropzone - Entire surface is clickable to browse */}
            <label
              htmlFor="auf-file-input"
              className={`auf-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseEnter={() => uploadIconRef.current?.startAnimation?.()}
              onMouseLeave={() => uploadIconRef.current?.stopAnimation?.()}
            >
              <input
                type="file"
                multiple
                id="auf-file-input"
                onChange={handleFilesSelected}
                className="upl-hidden-input"
              />
              <div className="auf-dropzone-content">
                <div className="auf-dropzone-icon-circle">
                  <UploadIcon ref={uploadIconRef} size={22} className="auf-dropzone-icon" />
                </div>
                <div className="auf-dropzone-text">
                  <span className="auf-dropzone-primary">
                    <strong>Click to upload</strong> or drag and drop files here
                  </span>
                  <span className="auf-dropzone-sub">
                    PDFs, documents, images, code files, and archives supported
                  </span>
                </div>
              </div>
            </label>

            {isUploadingFiles && !uploadStatus && (
              <span className="upl-file-uploading">Uploading…</span>
            )}

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
                        aria-label={`Remove ${name}`}
                      >
                        <Trash2Icon size={14} />
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
                <GlobeIcon size={15} />
              </div>
              <div className="auf-status-text">
                <span className="auf-status-label">Posting as</span>
                <span className={userId ? "auf-status-active" : "auf-status-inactive"}>
                  {userUsn ? `@${userUsn}` : userId ? "Authenticated User" : "Anonymous"}
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
                  <XIcon size={15} />
                  <span>Cancel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClear}
                  className="auf-btn auf-btn-clear"
                  disabled={loading || isUploadingFiles}
                >
                  <XIcon size={15} />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="submit"
                className="auf-btn auf-btn-submit"
                disabled={loading || isUploadingFiles}
                onMouseEnter={() => sendIconRef.current?.startAnimation?.()}
                onMouseLeave={() => sendIconRef.current?.stopAnimation?.()}
              >
                {loading ? (
                  <>
                    <span className="auf-spinner"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <SendIcon ref={sendIconRef} size={15} />
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
