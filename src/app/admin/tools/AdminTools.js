"use client";
/* global URLSearchParams, Blob */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FiFolder,
  FiFileText,
  FiDownload,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiHardDrive,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiArrowLeft,
  FiTool,
  FiEye,
} from "react-icons/fi";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { authFetch } from "@/lib/clientAuth";
import "./styles/AdminTools.css";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminTools() {
  const [activeTab, setActiveTab] = useState("files"); // "files" | "texts"

  // ── Stats ──
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTexts: 0,
    totalBytes: 0,
  });

  // ── Files state ──
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesPage, setFilesPage] = useState(1);
  const [filesLimit, setFilesLimit] = useState(15);
  const [filesTotalPages, setFilesTotalPages] = useState(1);
  const [filesTotal, setFilesTotal] = useState(0);

  // ── Texts state ──
  const [texts, setTexts] = useState([]);
  const [textsLoading, setTextsLoading] = useState(false);
  const [textsPage, setTextsPage] = useState(1);
  const [textsLimit, setTextsLimit] = useState(15);
  const [textsTotalPages, setTextsTotalPages] = useState(1);
  const [textsTotal, setTextsTotal] = useState(0);

  // ── Search & Filter ──
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  // ── Text Reader Modal ──
  const [viewingText, setViewingText] = useState(null);

  // ── Fetch Stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/tools/stats");
      const json = await res.json();
      if (json.success && json.stats) {
        setStats(json.stats);
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  }, []);

  // ── Fetch Files ──
  const fetchFiles = useCallback(async (page = 1, limit = 15, search = "") => {
    setFilesLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append("search", search);

      const res = await authFetch(`/api/admin/tools/files?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setFiles(json.files || []);
        setFilesTotal(json.pagination?.totalRecords || 0);
        setFilesTotalPages(json.pagination?.totalPages || 1);
        setFilesPage(json.pagination?.page || 1);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error("fetchFiles error:", err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  // ── Fetch Texts ──
  const fetchTexts = useCallback(async (page = 1, limit = 15, search = "") => {
    setTextsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append("search", search);

      const res = await authFetch(`/api/admin/tools/texts?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setTexts(json.texts || []);
        setTextsTotal(json.pagination?.totalRecords || 0);
        setTextsTotalPages(json.pagination?.totalPages || 1);
        setTextsPage(json.pagination?.page || 1);
      } else {
        setTexts([]);
      }
    } catch (err) {
      console.error("fetchTexts error:", err);
      setTexts([]);
    } finally {
      setTextsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "files") {
      fetchFiles(filesPage, filesLimit, searchQuery.trim());
    } else {
      fetchTexts(textsPage, textsLimit, searchQuery.trim());
    }
  }, [activeTab, filesPage, filesLimit, textsPage, textsLimit, fetchFiles, fetchTexts, searchQuery]);

  // ── Copy Code to Clipboard ──
  const handleCopyCode = (code) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // ── Search handler ──
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "files") {
      setFilesPage(1);
      fetchFiles(1, filesLimit, searchQuery.trim());
    } else {
      setTextsPage(1);
      fetchTexts(1, textsLimit, searchQuery.trim());
    }
  };

  // ── Download Text as .txt ──
  const handleDownloadText = (textItem) => {
    try {
      const element = document.createElement("a");
      const file = new Blob([textItem.text || ""], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = `text-${textItem.code}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Text download error:", err);
    }
  };

  // ── Edit File Modal (SweetAlert2) ──
  const handleEditFile = async (file) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Shared File",
      html: `
        <div style="text-align: left; font-family: inherit; display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 5px;">
              File Name <span style="color: #ef4444;">*</span>
            </label>
            <input 
              id="swal-edit-filename" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px;" 
              value="${file.originalName.replace(/"/g, '&quot;')}"
              placeholder="e.g. document.pdf"
            />
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 5px;">
              Retrieval Code <span style="color: #ef4444;">*</span>
            </label>
            <input 
              id="swal-edit-fileid" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; text-transform: lowercase; font-family: monospace;" 
              value="${file.fileid}"
              placeholder="e.g. abc123"
            />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "sm-swal-popup",
        confirmButton: "sm-swal-confirm",
        cancelButton: "sm-swal-cancel",
      },
      preConfirm: () => {
        const originalName = document.getElementById("swal-edit-filename").value.trim();
        const fileid = document.getElementById("swal-edit-fileid").value.trim().toLowerCase();

        if (!originalName) {
          Swal.showValidationMessage("File Name is required.");
          return false;
        }
        if (!fileid) {
          Swal.showValidationMessage("Retrieval Code is required.");
          return false;
        }

        return { originalName, fileid };
      },
    });

    if (formValues) {
      try {
        const res = await authFetch("/api/admin/tools/files", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: file._id,
            originalName: formValues.originalName,
            fileid: formValues.fileid,
          }),
        });

        const json = await res.json();
        if (json.success) {
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "File record updated successfully.",
            timer: 2000,
            showConfirmButton: false,
          });
          setFiles((prev) =>
            prev.map((f) => (f._id === file._id ? { ...f, ...json.file } : f))
          );
        } else {
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: json.error || "Could not update file.",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to update file.",
        });
      }
    }
  };

  // ── Delete File Modal (SweetAlert2) ──
  const handleDeleteFile = async (file) => {
    const result = await Swal.fire({
      title: "Delete File Permanently?",
      text: `Are you sure you want to delete "${file.originalName}" (${file.fileid}) from the database and Cloudinary storage?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete file",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "sm-swal-popup",
        confirmButton: "sm-swal-confirm",
        cancelButton: "sm-swal-cancel",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await authFetch(`/api/admin/tools/files?id=${file._id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "File deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
        setFilesTotal((prev) => Math.max(0, prev - 1));
        fetchStats();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Delete",
          text: json.error || "Could not delete file.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete file.",
      });
    }
  };

  // ── Edit Text Modal (SweetAlert2) ──
  const handleEditText = async (textItem) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Shared Text",
      html: `
        <div style="text-align: left; font-family: inherit; display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 5px;">
              Share Code <span style="color: #ef4444;">*</span>
            </label>
            <input 
              id="swal-edit-text-code" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; text-transform: lowercase; font-family: monospace;" 
              value="${textItem.code}"
              placeholder="e.g. abc123"
            />
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 5px;">
              Text Content <span style="color: #ef4444;">*</span>
            </label>
            <textarea 
              id="swal-edit-text-content" 
              class="swal2-textarea" 
              style="margin: 0; width: 100%; height: 160px; box-sizing: border-box; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; line-height: 1.5; font-family: inherit;"
              placeholder="Enter text..."
            >${textItem.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          </div>
          <div>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer;">
              <input type="checkbox" id="swal-edit-text-access" ${textItem.editAccess ? "checked" : ""} style="width: 16px; height: 16px;" />
              Allow Anyone with Code to Edit (Public Edit Access)
            </label>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
      width: "560px",
      customClass: {
        popup: "sm-swal-popup",
        confirmButton: "sm-swal-confirm",
        cancelButton: "sm-swal-cancel",
      },
      preConfirm: () => {
        const code = document.getElementById("swal-edit-text-code").value.trim().toLowerCase();
        const text = document.getElementById("swal-edit-text-content").value;
        const editAccess = document.getElementById("swal-edit-text-access").checked;

        if (!code) {
          Swal.showValidationMessage("Share Code is required.");
          return false;
        }
        if (!text || !text.trim()) {
          Swal.showValidationMessage("Text Content cannot be empty.");
          return false;
        }

        return { code, text, editAccess };
      },
    });

    if (formValues) {
      try {
        const res = await authFetch("/api/admin/tools/texts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: textItem._id,
            code: formValues.code,
            text: formValues.text,
            editAccess: formValues.editAccess,
          }),
        });

        const json = await res.json();
        if (json.success) {
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Text record updated successfully.",
            timer: 2000,
            showConfirmButton: false,
          });
          setTexts((prev) =>
            prev.map((t) => (t._id === textItem._id ? { ...t, ...json.textShare } : t))
          );
        } else {
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: json.error || "Could not update text.",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to update text.",
        });
      }
    }
  };

  // ── Delete Text Modal (SweetAlert2) ──
  const handleDeleteText = async (textItem) => {
    const result = await Swal.fire({
      title: "Delete Shared Text?",
      text: `Are you sure you want to delete note with code "${textItem.code}" permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete text",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "sm-swal-popup",
        confirmButton: "sm-swal-confirm",
        cancelButton: "sm-swal-cancel",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await authFetch(`/api/admin/tools/texts?id=${textItem._id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Text deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        setTexts((prev) => prev.filter((t) => t._id !== textItem._id));
        setTextsTotal((prev) => Math.max(0, prev - 1));
        fetchStats();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Delete",
          text: json.error || "Could not delete text.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete text.",
      });
    }
  };

  return (
    <div className="at-root">
      {/* ── Header ── */}
      <div className="at-header">
        <div className="at-title-wrap">
          <div className="at-icon-badge">
            <FiTool size={26} />
          </div>
          <div>
            <h1 className="at-title">Tools Management</h1>
            <p className="at-subtitle">
              Inspect uploaded files, retrieve shared texts, manage codes, and maintain cloud storage.
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="at-btn-pill"
          style={{ textDecoration: "none" }}
        >
          <FiArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* ── Apple-style Stat Cards ── */}
      <div className="at-stats-grid">
        <div className="at-stat-card">
          <div className="at-stat-icon-wrap" style={{ background: "#eff6ff", color: "#3b82f6" }}>
            <FiFolder size={22} />
          </div>
          <div className="at-stat-info">
            <span className="at-stat-label">Active Files</span>
            <span className="at-stat-val">{stats.totalFiles}</span>
          </div>
        </div>

        <div className="at-stat-card">
          <div className="at-stat-icon-wrap" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
            <FiHardDrive size={22} />
          </div>
          <div className="at-stat-info">
            <span className="at-stat-label">Storage Consumed</span>
            <span className="at-stat-val">{formatBytes(stats.totalBytes)}</span>
          </div>
        </div>

        <div className="at-stat-card">
          <div className="at-stat-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
            <FiFileText size={22} />
          </div>
          <div className="at-stat-info">
            <span className="at-stat-label">Shared Text Notes</span>
            <span className="at-stat-val">{stats.totalTexts}</span>
          </div>
        </div>
      </div>

      {/* ── Segmented Control Tabs ── */}
      <div className="at-segmented-bar">
        <div className="at-segmented-ctrl">
          <button
            className={`at-segment-btn ${activeTab === "files" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("files");
              setSearchQuery("");
            }}
          >
            <FiFolder size={17} />
            <span>Uploaded Files</span>
            <span className="at-segment-badge">{filesTotal}</span>
          </button>

          <button
            className={`at-segment-btn ${activeTab === "texts" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("texts");
              setSearchQuery("");
            }}
          >
            <FiFileText size={17} />
            <span>Shared Texts</span>
            <span className="at-segment-badge">{textsTotal}</span>
          </button>
        </div>

        {/* View Tools Public Page */}
        <Link
          href="/tools"
          target="_blank"
          className="at-btn-pill"
          style={{ textDecoration: "none" }}
        >
          <span>Open Public Tools Page</span>
          <FiExternalLink size={14} />
        </Link>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="at-control-card">
        <form className="at-search-wrap" onSubmit={handleSearchSubmit}>
          <FiSearch className="at-search-icon" size={18} />
          <input
            type="text"
            className="at-search-input"
            placeholder={
              activeTab === "files"
                ? "Search files by name, retrieval code, or MIME type..."
                : "Search shared texts by code or content snippet..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <button
          className="at-btn-refresh"
          onClick={() => {
            fetchStats();
            if (activeTab === "files") fetchFiles(filesPage, filesLimit, searchQuery.trim());
            else fetchTexts(textsPage, textsLimit, searchQuery.trim());
          }}
          title="Refresh records"
        >
          <FiRefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: UPLOADED FILES
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "files" && (
        <div className="at-content-card">
          {filesLoading ? (
            <div className="at-loading">Loading uploaded files...</div>
          ) : files.length === 0 ? (
            <div className="at-empty-state">
              <FiFolder className="at-empty-icon" />
              <h3>No Files Found</h3>
              <p>No active files match the query or no files have been uploaded yet.</p>
            </div>
          ) : (
            <div className="at-table-responsive">
              <table className="at-table">
                <thead>
                  <tr>
                    <th>Retrieval Code</th>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Uploaded At</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const downloadUrl = file.cloudinaryUrl?.includes("res.cloudinary.com")
                      ? file.cloudinaryUrl.replace("/upload/", "/upload/fl_attachment/")
                      : file.cloudinaryUrl;

                    return (
                      <tr key={file._id}>
                        {/* Retrieval Code */}
                        <td>
                          <button
                            className="at-code-pill"
                            onClick={() => handleCopyCode(file.fileid)}
                            title="Click to copy retrieval code"
                          >
                            <span>{file.fileid}</span>
                            <span className="at-code-pill-copy">
                              {copiedCode === file.fileid ? (
                                <FiCheck size={14} color="#16a34a" />
                              ) : (
                                <FiCopy size={13} />
                              )}
                            </span>
                          </button>
                        </td>

                        {/* File Name */}
                        <td>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {file.originalName}
                          </span>
                          <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: 2 }}>
                            By: {file.uploadedBy || "anonymous"}
                          </div>
                        </td>

                        {/* Size */}
                        <td>
                          <span style={{ fontWeight: 600, color: "#334155" }}>
                            {formatBytes(file.size)}
                          </span>
                        </td>

                        {/* MIME Type Badge */}
                        <td>
                          <span className={`at-badge ${file.mimeType?.includes("pdf") ? "at-badge-pdf" : file.mimeType?.startsWith("image/") ? "at-badge-image" : "at-badge-default"}`}>
                            {file.mimeType || "file"}
                          </span>
                        </td>

                        {/* Uploaded At */}
                        <td style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <FiClock size={13} />
                            <span>
                              {file.createdAt ? new Date(file.createdAt).toLocaleString() : "—"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div className="at-actions-wrap">
                            {/* Direct Download */}
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="at-btn-icon at-btn-download"
                              title="Download File"
                              download={file.originalName}
                            >
                              <FiDownload size={15} />
                            </a>

                            {/* View / Cloudinary Link */}
                            {file.cloudinaryUrl && (
                              <a
                                href={file.cloudinaryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="at-btn-icon"
                                title="Open / Preview in New Tab"
                              >
                                <FiEye size={15} />
                              </a>
                            )}

                            {/* Edit */}
                            <button
                              className="at-btn-icon at-btn-edit"
                              onClick={() => handleEditFile(file)}
                              title="Edit File Record"
                            >
                              <FiEdit2 size={15} />
                            </button>

                            {/* Delete */}
                            <button
                              className="at-btn-icon at-btn-delete"
                              onClick={() => handleDeleteFile(file)}
                              title="Delete from DB & Cloudinary"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="at-pagination-bar">
            <div className="at-pagination-info">
              Showing page {filesPage} of {filesTotalPages} ({filesTotal} total files)
            </div>

            <div className="at-pagination-controls">
              <label htmlFor="filesLimitSelect" style={{ fontSize: "0.82rem", color: "#64748b", marginRight: 8 }}>Per page:</label>
              <select
                id="filesLimitSelect"
                style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #cbd5e1", marginRight: 12 }}
                value={filesLimit}
                onChange={(e) => {
                  setFilesLimit(Number(e.target.value));
                  setFilesPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
              </select>

              <button
                className="at-page-btn"
                onClick={() => setFilesPage((p) => Math.max(1, p - 1))}
                disabled={filesPage <= 1}
              >
                <FiChevronLeft size={16} />
              </button>

              <span style={{ fontSize: "0.88rem", fontWeight: 700, padding: "0 6px" }}>
                {filesPage}
              </span>

              <button
                className="at-page-btn"
                onClick={() => setFilesPage((p) => Math.min(filesTotalPages, p + 1))}
                disabled={filesPage >= filesTotalPages}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: SHARED TEXTS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "texts" && (
        <div className="at-content-card">
          {textsLoading ? (
            <div className="at-loading">Loading shared text notes...</div>
          ) : texts.length === 0 ? (
            <div className="at-empty-state">
              <FiFileText className="at-empty-icon" />
              <h3>No Shared Texts Found</h3>
              <p>No active text shares match the query or no text has been shared yet.</p>
            </div>
          ) : (
            <div className="at-table-responsive">
              <table className="at-table">
                <thead>
                  <tr>
                    <th>Share Code</th>
                    <th>Text Content Preview</th>
                    <th>Characters</th>
                    <th>Access Mode</th>
                    <th>Created At</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {texts.map((textItem) => {
                    const snippet = textItem.text
                      ? textItem.text.slice(0, 75) + (textItem.text.length > 75 ? "..." : "")
                      : "(empty)";

                    return (
                      <tr key={textItem._id}>
                        {/* Share Code */}
                        <td>
                          <button
                            className="at-code-pill"
                            onClick={() => handleCopyCode(textItem.code)}
                            title="Click to copy share code"
                          >
                            <span>{textItem.code}</span>
                            <span className="at-code-pill-copy">
                              {copiedCode === textItem.code ? (
                                <FiCheck size={14} color="#16a34a" />
                              ) : (
                                <FiCopy size={13} />
                              )}
                            </span>
                          </button>
                        </td>

                        {/* Content Snippet */}
                        <td>
                          <div style={{ fontWeight: 600, color: "#0f172a", maxWidth: 360 }}>
                            {snippet}
                          </div>
                        </td>

                        {/* Length */}
                        <td>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
                            {textItem.text?.length || 0} chars
                          </span>
                        </td>

                        {/* Access Mode */}
                        <td>
                          <span className={`at-badge ${textItem.editAccess ? "at-badge-edit" : "at-badge-readonly"}`}>
                            {textItem.editAccess ? "Public Edit" : "View Only"}
                          </span>
                        </td>

                        {/* Created At */}
                        <td style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <FiClock size={13} />
                            <span>
                              {textItem.createdAt ? new Date(textItem.createdAt).toLocaleString() : "—"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div className="at-actions-wrap">
                            {/* Read / Retrieve Full Text */}
                            <button
                              className="at-btn-icon at-btn-retrieve"
                              onClick={() => setViewingText(textItem)}
                              title="Retrieve & Read Full Text"
                            >
                              <FiEye size={15} />
                            </button>

                            {/* Download as .txt */}
                            <button
                              className="at-btn-icon at-btn-download"
                              onClick={() => handleDownloadText(textItem)}
                              title="Download as .txt File"
                            >
                              <FiDownload size={15} />
                            </button>

                            {/* Edit */}
                            <button
                              className="at-btn-icon at-btn-edit"
                              onClick={() => handleEditText(textItem)}
                              title="Edit Text or Share Code"
                            >
                              <FiEdit2 size={15} />
                            </button>

                            {/* Delete */}
                            <button
                              className="at-btn-icon at-btn-delete"
                              onClick={() => handleDeleteText(textItem)}
                              title="Delete Text Record"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="at-pagination-bar">
            <div className="at-pagination-info">
              Showing page {textsPage} of {textsTotalPages} ({textsTotal} total texts)
            </div>

            <div className="at-pagination-controls">
              <label htmlFor="textsLimitSelect" style={{ fontSize: "0.82rem", color: "#64748b", marginRight: 8 }}>Per page:</label>
              <select
                id="textsLimitSelect"
                style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #cbd5e1", marginRight: 12 }}
                value={textsLimit}
                onChange={(e) => {
                  setTextsLimit(Number(e.target.value));
                  setTextsPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
              </select>

              <button
                className="at-page-btn"
                onClick={() => setTextsPage((p) => Math.max(1, p - 1))}
                disabled={textsPage <= 1}
              >
                <FiChevronLeft size={16} />
              </button>

              <span style={{ fontSize: "0.88rem", fontWeight: 700, padding: "0 6px" }}>
                {textsPage}
              </span>

              <button
                className="at-page-btn"
                onClick={() => setTextsPage((p) => Math.min(textsTotalPages, p + 1))}
                disabled={textsPage >= textsTotalPages}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apple-style Full Text Reader Modal ── */}
      {viewingText && (
        <div className="at-modal-overlay" onClick={() => setViewingText(null)}>
          <div className="at-modal" onClick={(e) => e.stopPropagation()}>
            <div className="at-modal-header">
              <h3 className="at-modal-title">
                <FiFileText color="#d97706" />
                <span>Text Note ({viewingText.code})</span>
              </h3>
              <button
                className="at-modal-close"
                onClick={() => setViewingText(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="at-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>
                  Length: <strong>{viewingText.text?.length || 0}</strong> characters •{" "}
                  <strong>{viewingText.text ? viewingText.text.trim().split(/\s+/).length : 0}</strong> words
                </span>
                <span className={`at-badge ${viewingText.editAccess ? "at-badge-edit" : "at-badge-readonly"}`}>
                  {viewingText.editAccess ? "Public Edit" : "View Only"}
                </span>
              </div>

              <div className="at-text-content-box">
                {viewingText.text}
              </div>
            </div>

            <div className="at-modal-footer">
              <button
                type="button"
                className="at-btn-pill"
                onClick={() => handleCopyCode(viewingText.text)}
              >
                <FiCopy size={15} />
                <span>Copy Full Text</span>
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="at-btn-pill at-btn-pill-primary"
                  onClick={() => handleDownloadText(viewingText)}
                >
                  <FiDownload size={15} />
                  <span>Download .txt</span>
                </button>

                <button
                  type="button"
                  className="at-btn-pill"
                  onClick={() => setViewingText(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
