"use client";

import React, { useState, useEffect } from "react";
import {
  XIcon,
  GlobeIcon,
  LockIcon,
  LinkIcon,
  CheckIcon,
  UploadIcon,
  Trash2Icon,
  SaveIcon,
  PencilIcon,
} from "@animateicons/react/lucide";
import FileIcon from "@/app/components/FileIcon";
import { uploadFileViaWebSocket } from "@/lib/websocketUploader";
import "./styles/EditUpdateModal.css";

export default function EditUpdateModal({
  isOpen,
  update,
  currentUserId,
  onClose,
  onSaveSuccess,
  showToast,
}) {
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLinksText, setEditLinksText] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [editVisibility, setEditVisibility] = useState("public");
  const [isSaving, setIsSaving] = useState(false);
  const [editIsUploading, setEditIsUploading] = useState(false);
  const [editUploadStatus, setEditUploadStatus] = useState(null);
  const [editIsDragging, setEditIsDragging] = useState(false);

  useEffect(() => {
    if (update && isOpen) {
      setEditTitle(update.title || "");
      setEditContent(update.content || "");
      setEditLinksText(Array.isArray(update.links) ? update.links.join("\n") : "");
      setEditFiles(Array.isArray(update.files) ? [...update.files] : []);
      setEditVisibility(update.visibility || "public");
    }
  }, [update, isOpen]);

  if (!isOpen || !update) return null;

  const parseLinks = (text) => {
    if (!text) return [];
    return text
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const processEditFiles = async (files) => {
    if (!files || !files.length) return;
    setEditIsUploading(true);
    setEditUploadStatus({
      current: 1,
      total: files.length,
      filename: files[0]?.name,
      percent: 0,
      statusText: "Preparing upload...",
    });

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    const newFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setEditUploadStatus({
          current: i + 1,
          total: files.length,
          filename: f.name,
          percent: 0,
          statusText: `Uploading ${f.name}...`,
        });

        const uploadResult = await uploadFileViaWebSocket(f, {
          userId: currentUserId,
          token,
          onProgress: ({ percent, currentChunk, totalChunks, statusText }) => {
            setEditUploadStatus({
              current: i + 1,
              total: files.length,
              filename: f.name,
              percent,
              statusText: statusText || `${percent}% uploaded`,
            });
          },
        });

        const uploadedFile = uploadResult?.file;
        if (uploadedFile) {
          newFiles.push(uploadedFile);
        } else {
          showToast?.(`Failed to upload ${f.name}`, "error");
        }
      }

      if (newFiles.length > 0) {
        setEditFiles((prev) => [...prev, ...newFiles]);
        showToast?.(
          `Attached ${newFiles.length} file${newFiles.length > 1 ? "s" : ""} successfully`,
          "success"
        );
      }
    } catch (err) {
      console.error("Edit file upload error:", err);
      showToast?.(err.message || "File upload failed", "error");
    } finally {
      setEditIsUploading(false);
      setEditUploadStatus(null);
    }
  };

  const handleEditFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await processEditFiles(files);
    if (e?.target) e.target.value = null;
  };

  const handleEditDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editIsDragging) setEditIsDragging(true);
  };

  const handleEditDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditIsDragging(false);
  };

  const handleEditDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      await processEditFiles(files);
    }
  };

  const removeEditFile = (idx) => {
    setEditFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      showToast?.("You must be signed in to edit", "error");
      return;
    }

    if (!editTitle.trim()) {
      showToast?.("Please provide a title", "error");
      return;
    }

    setIsSaving(true);
    const payload = {
      updateId: update._id,
      userId: currentUserId,
      title: editTitle.trim(),
      content: editContent,
      links: parseLinks(editLinksText),
      files: editFiles,
      visibility: editVisibility,
    };

    try {
      const res = await fetch("/api/updates/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");

      showToast?.("Update saved successfully", "success");
      onSaveSuccess?.(data.update);
      onClose();
    } catch (err) {
      console.error("Edit error:", err);
      showToast?.(err.message || "Failed to save update", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="eum-modal-overlay" onClick={onClose}>
      <div className="eum-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Title and Single X Close Button */}
        <div className="eum-card-header">
          <div className="eum-header-title-wrap">
            <PencilIcon size={18} className="eum-header-icon" />
            <h2 className="eum-card-title">Edit Update</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="eum-card-close-btn"
            title="Close"
            aria-label="Close edit update modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="eum-form">
          {/* Section 1: Title */}
          <div className="eum-field">
            <div className="eum-label-row">
              <label className="eum-label">Title</label>
              <span className="eum-char-count">{editTitle.length} characters</span>
            </div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="eum-input"
              placeholder="Update title..."
              required
            />
          </div>

          {/* Section 2: Visibility (Apple-style Segmented Pills) */}
          <div className="eum-field">
            <label className="eum-label">Visibility Level</label>
            <div className="eum-vis-segmented">
              <button
                type="button"
                className={`eum-vis-option ${editVisibility === "public" ? "active eum-vis-public" : ""}`}
                onClick={() => setEditVisibility("public")}
              >
                <div className="eum-vis-icon-circle">
                  <GlobeIcon size={15} />
                </div>
                <div className="eum-vis-text-box">
                  <span className="eum-vis-title">Public</span>
                  <span className="eum-vis-desc">Campus feed</span>
                </div>
                {editVisibility === "public" && <CheckIcon size={15} className="eum-vis-check" />}
              </button>

              <button
                type="button"
                className={`eum-vis-option ${editVisibility === "unlisted" ? "active eum-vis-unlisted" : ""}`}
                onClick={() => setEditVisibility("unlisted")}
              >
                <div className="eum-vis-icon-circle">
                  <LinkIcon size={15} />
                </div>
                <div className="eum-vis-text-box">
                  <span className="eum-vis-title">Unlisted</span>
                  <span className="eum-vis-desc">Anyone with link</span>
                </div>
                {editVisibility === "unlisted" && <CheckIcon size={15} className="eum-vis-check" />}
              </button>

              <button
                type="button"
                className={`eum-vis-option ${editVisibility === "private" ? "active eum-vis-private" : ""}`}
                onClick={() => setEditVisibility("private")}
              >
                <div className="eum-vis-icon-circle">
                  <LockIcon size={15} />
                </div>
                <div className="eum-vis-text-box">
                  <span className="eum-vis-title">Private</span>
                  <span className="eum-vis-desc">Only you</span>
                </div>
                {editVisibility === "private" && <CheckIcon size={15} className="eum-vis-check" />}
              </button>
            </div>
          </div>

          {/* Section 3: Content (Optional) */}
          <div className="eum-field">
            <div className="eum-label-row">
              <label className="eum-label">Content (optional)</label>
              <span className="eum-char-count">{editContent.length} characters</span>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="eum-textarea"
              placeholder="Update content... (optional)"
            />
          </div>

          {/* Section 4: Links */}
          <div className="eum-field">
            <label className="eum-label">Links & References (optional)</label>
            <textarea
              value={editLinksText}
              onChange={(e) => setEditLinksText(e.target.value)}
              rows={2}
              className="eum-textarea eum-textarea-links"
              placeholder="/internal-link or https://external-link.com"
            />
          </div>

          {/* Section 5: Files Drag & Drop */}
          <div className="eum-field">
            <div className="eum-label-row">
              <label className="eum-label">Files & Attachments (optional)</label>
              {editFiles && editFiles.length > 0 && (
                <span className="eum-file-count">
                  {editFiles.length} {editFiles.length === 1 ? "file" : "files"} attached
                </span>
              )}
            </div>

            <label
              htmlFor="eum-file-input"
              className={`eum-dropzone ${editIsDragging ? "dragging" : ""}`}
              onDragOver={handleEditDragOver}
              onDragEnter={handleEditDragOver}
              onDragLeave={handleEditDragLeave}
              onDrop={handleEditDrop}
            >
              <input
                type="file"
                multiple
                id="eum-file-input"
                onChange={handleEditFilesSelected}
                className="eum-hidden-input"
              />
              <div className="eum-dropzone-content">
                <div className="eum-dropzone-icon-circle">
                  <UploadIcon size={20} className="eum-dropzone-icon" />
                </div>
                <div className="eum-dropzone-text">
                  <span className="eum-dropzone-primary">
                    <strong>Click to upload</strong> or drag and drop files here
                  </span>
                  <span className="eum-dropzone-sub">
                    PDFs, documents, images, code files, and archives
                  </span>
                </div>
              </div>
            </label>

            {editIsUploading && !editUploadStatus && (
              <span className="eum-file-uploading">Uploading…</span>
            )}

            {/* Progress */}
            {editIsUploading && editUploadStatus && (
              <div className="eum-progress-box">
                <div className="eum-progress-header">
                  <span className="eum-progress-filename">
                    <strong>{editUploadStatus.filename}</strong>
                    {editUploadStatus.total > 1 &&
                      ` (File ${editUploadStatus.current}/${editUploadStatus.total})`}
                  </span>
                  <span className="eum-progress-tag">
                    {editUploadStatus.percent || 0}% uploaded
                  </span>
                </div>
                <div className="eum-progress-track">
                  <div
                    className="eum-progress-fill"
                    style={{ width: `${Math.max(2, editUploadStatus.percent || 0)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Attached file list */}
            {editFiles && editFiles.length > 0 && (
              <div className="eum-files-list">
                {editFiles.map((f, i) => {
                  const url = f.url || f;
                  const name =
                    f.name || (typeof url === "string" ? url.split("/").pop() : "Attachment");
                  const viewUrl =
                    typeof url === "string" && url.startsWith("http")
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
                      : url;

                  return (
                    <div key={i} className="eum-file-item">
                      <div className="eum-file-info">
                        <FileIcon filename={name} />
                        <a
                          href={viewUrl}
                          className="eum-file-link"
                          target="_blank"
                          rel="noreferrer noopener"
                          title={name}
                        >
                          {name}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="eum-file-remove"
                        onClick={() => removeEditFile(i)}
                        title={`Remove ${name}`}
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

          {/* Action Buttons */}
          <div className="eum-actions">
            <button
              type="button"
              onClick={onClose}
              className="eum-btn eum-btn-cancel"
              disabled={isSaving || editIsUploading}
            >
              <XIcon size={15} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="eum-btn eum-btn-primary"
              disabled={isSaving || editIsUploading}
            >
              {isSaving ? (
                <>
                  <span className="eum-spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SaveIcon size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

