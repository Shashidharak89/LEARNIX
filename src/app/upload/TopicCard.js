"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import imageCompression from "browser-image-compression";
import {
  FiFileText, FiUpload, FiTrash2, FiImage, FiCalendar, FiCheck,
  FiChevronDown, FiChevronUp, FiX, FiAlertTriangle, FiCamera, FiFile,
  FiCheckCircle, FiLoader, FiShare2, FiMessageSquare, FiMoreVertical,
  FiEdit2, FiLock, FiUnlock, FiChevronRight,
} from "react-icons/fi";
import PDFProcessor from "./PDFProcessor";
import "./styles/TopicCard.css";

export default function TopicCard({ subject, topic, usn, isLoading, onTopicDelete, onRefreshSubjects, showMessage }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed]       = useState(true);
  const [uploadingStates, setUploadingStates]   = useState({});
  const [compressionStates, setCompressionStates] = useState({});
  const [filesMap, setFilesMap]             = useState({});
  const [filePreviewMap, setFilePreviewMap] = useState({});
  const [expandedImages, setExpandedImages] = useState({});
  const [deleteConfirm, setDeleteConfirm]   = useState({ show: false, subject: "", topic: "", imageUrl: "" });
  const [showCaptureOptions, setShowCaptureOptions] = useState({});
  const [showPDFProcessor, setShowPDFProcessor]     = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles]   = useState({});
  const [uploadComplete, setUploadComplete] = useState({});
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [openMenu, setOpenMenu]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamingTopic, setIsRenamingTopic] = useState(false);

  const menuRef        = useRef(null);
  const cameraInputRefs = useRef({});
  const topicKey = `${subject}-${topic.topic}`;

  /* ── collapse ── */
  const toggleCollapse = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setOpenMenu(false);
    setIsCollapsed((p) => !p);
  };

  const shouldIgnore = (target) => {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(target.closest(".tc-menu-wrap, .tc-dropdown, .tc-menu-btn, .tc-dropdown-item, a, button, input, select, textarea, label"));
  };

  /* ── cleanup preview URLs ── */
  useEffect(() => {
    return () => {
      Object.values(filePreviewMap).forEach((urls) => {
        if (Array.isArray(urls)) urls.forEach((u) => URL.revokeObjectURL(u));
        else if (urls) URL.revokeObjectURL(urls);
      });
    };
  }, [filePreviewMap]);

  /* ── close menu on outside click ── */
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false); };
    if (openMenu) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  /* ── image compression ── */
  const compressImage = async (file) => {
    return imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true, quality: 0.8, fileType: "image/jpeg" });
  };

  const toggleCaptureOptions = () => setShowCaptureOptions((p) => ({ ...p, [topicKey]: !p[topicKey] }));
  const togglePDFProcessor   = () => setShowPDFProcessor((p)   => ({ ...p, [topicKey]: !p[topicKey] }));
  const triggerCameraCapture = () => cameraInputRefs.current[topicKey]?.click();

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (file) { await handleSingleFileChange(file); setShowCaptureOptions((p) => ({ ...p, [topicKey]: false })); }
  };

  const handleSingleFileChange = async (file) => {
    if (!file) {
      setFilesMap({ ...filesMap, [topicKey]: null });
      if (filePreviewMap[topicKey]) {
        URL.revokeObjectURL(filePreviewMap[topicKey]);
        const m = { ...filePreviewMap }; delete m[topicKey]; setFilePreviewMap(m);
      }
      return;
    }
    if (!file.type.startsWith("image/")) { showMessage("Please select a valid image file.", "error"); return; }
    try {
      setCompressionStates((p) => ({ ...p, [topicKey]: true }));
      showMessage("Compressing image...", "");
      const compressed = await compressImage(file);
      const final = new File([compressed], file.name, { type: compressed.type, lastModified: Date.now() });
      setFilesMap({ ...filesMap, [topicKey]: final });
      setFilePreviewMap({ ...filePreviewMap, [topicKey]: URL.createObjectURL(final) });
      const ratio = ((file.size - final.size) / file.size * 100).toFixed(1);
      showMessage(`Compressed by ${ratio}% (${(file.size/1024/1024).toFixed(2)}MB → ${(final.size/1024/1024).toFixed(2)}MB)`, "success");
    } catch { showMessage("Image compression failed.", "error"); }
    finally { setCompressionStates((p) => { const n = { ...p }; delete n[topicKey]; return n; }); }
  };

  const handleMultipleFileChange = async (e) => {
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length) { showMessage("Please select valid image files.", "error"); return; }
    files.sort((a, b) => a.lastModified - b.lastModified);
    try {
      setCompressionStates((p) => ({ ...p, [topicKey]: true }));
      const processed = [], previews = [];
      for (let i = 0; i < files.length; i++) {
        showMessage(`Compressing image ${i + 1}/${files.length}…`, "");
        const c = await compressImage(files[i]);
        const f = new File([c], files[i].name, { type: c.type, lastModified: Date.now() });
        processed.push({ file: f, originalSize: files[i].size, compressedSize: f.size, name: files[i].name });
        previews.push(URL.createObjectURL(f));
      }
      setFilesMap((p) => ({ ...p, [topicKey]: processed }));
      setFilePreviewMap((p) => ({ ...p, [topicKey]: previews }));
      const tot = processed.reduce((s, f) => s + f.originalSize, 0);
      const comp = processed.reduce((s, f) => s + f.compressedSize, 0);
      showMessage(`${files.length} images processed. Compression: ${((tot - comp) / tot * 100).toFixed(1)}%`, "success");
    } catch { showMessage("Image compression failed.", "error"); }
    finally { setCompressionStates((p) => { const n = { ...p }; delete n[topicKey]; return n; }); }
  };

  const toggleImageExpansion = () => setExpandedImages((p) => ({ ...p, [topicKey]: !p[topicKey] }));

  const showDeleteConfirmation = (imageUrl) => setDeleteConfirm({ show: true, subject, topic: topic.topic, imageUrl });
  const cancelDelete = () => setDeleteConfirm({ show: false, subject: "", topic: "", imageUrl: "" });
  const confirmDelete = async () => { await handleDeleteImage(deleteConfirm.imageUrl); cancelDelete(); };

  const handleUploadImage = async () => {
    const file = filesMap[topicKey];
    if (!file) { showMessage("Please select a file first.", "error"); return; }
    setUploadingStates((p) => ({ ...p, [topicKey]: true }));
    const fd = new FormData();
    fd.append("usn", usn); fd.append("subject", subject); fd.append("topic", topic.topic); fd.append("file", file);
    try {
      await axios.post("/api/topic/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onRefreshSubjects();
      setFilesMap({ ...filesMap, [topicKey]: null });
      if (filePreviewMap[topicKey]) { URL.revokeObjectURL(filePreviewMap[topicKey]); const m = { ...filePreviewMap }; delete m[topicKey]; setFilePreviewMap(m); }
      showMessage("Image uploaded successfully!", "success");
    } catch (err) { showMessage(err.response?.data?.error || "Upload failed", "error"); }
    finally { setUploadingStates((p) => { const n = { ...p }; delete n[topicKey]; return n; }); }
  };

  const uploadSingleFile = async (fileData, idx, total) => {
    const fd = new FormData();
    fd.append("usn", usn); fd.append("subject", subject); fd.append("topic", topic.topic); fd.append("file", fileData.file, fileData.name);
    try {
      await axios.post("/api/topic/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onRefreshSubjects();
      setUploadedFiles((p) => ({ ...p, [topicKey]: new Set([...(p[topicKey] || []), idx]) }));
      setUploadProgress((p) => ({ ...p, [topicKey]: Math.round((idx / total) * 100) }));
    } catch { showMessage(`Failed to upload ${fileData.name}`, "error"); }
  };

  const uploadMultipleFilesSequentially = async () => {
    const files = filesMap[topicKey];
    if (!files?.length) { showMessage("Please select files first.", "error"); return; }
    setUploadingStates((p) => ({ ...p, [topicKey]: true }));
    setUploadProgress((p) => ({ ...p, [topicKey]: 0 }));
    setUploadedFiles((p) => ({ ...p, [topicKey]: new Set() }));
    setUploadComplete((p) => ({ ...p, [topicKey]: false }));
    for (let i = 0; i < files.length; i++) await uploadSingleFile(files[i], i + 1, files.length);
    setUploadingStates((p) => { const n = { ...p }; delete n[topicKey]; return n; });
    setUploadComplete((p) => ({ ...p, [topicKey]: true }));
    showMessage("All images uploaded successfully!", "success");
    setTimeout(() => {
      setFilesMap((p) => { const n = { ...p }; delete n[topicKey]; return n; });
      if (filePreviewMap[topicKey]) { filePreviewMap[topicKey].forEach((u) => URL.revokeObjectURL(u)); setFilePreviewMap((p) => { const n = { ...p }; delete n[topicKey]; return n; }); }
      setUploadComplete((p) => { const n = { ...p }; delete n[topicKey]; return n; });
    }, 2000);
  };

  const handleDeleteImage = async (imageUrl) => {
    try {
      await axios.put("/api/topic/deleteimage", { usn, subject, topic: topic.topic, imageUrl });
      onRefreshSubjects();
      showMessage("Image deleted successfully!", "success");
    } catch (err) { showMessage(err.response?.data?.error || "Failed to delete image", "error"); }
  };

  const handlePublicToggle = async () => {
    if (isLoading || isTogglingPublic) return;
    setIsTogglingPublic(true);
    try {
      await axios.put("/api/topic/public", { usn, subject, topic: topic.topic, public: !topic.public });
      onRefreshSubjects();
      showMessage(`Topic is now ${!topic.public ? "public" : "private"}`, "success");
    } catch (err) { showMessage(err.response?.data?.error || "Failed to update visibility", "error"); }
    finally { setIsTogglingPublic(false); }
  };

  const handlePDFUploadSuccess = () => {
    onRefreshSubjects();
    showMessage("PDF pages uploaded successfully!", "success");
    setShowPDFProcessor((p) => ({ ...p, [topicKey]: false }));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/works/${topic._id}`;
    if (navigator.share) { try { await navigator.share({ title: topic.topic, url }); return; } catch {} }
    navigator.clipboard.writeText(url)
      .then(() => showMessage("Link copied to clipboard!", "success"))
      .catch(() => showMessage("Failed to copy link", "error"));
  };

  const handleOpenTopic   = () => { setOpenMenu(false); router.push(`/works/${topic._id}`); };
  const handleOpenReviews = () => { setOpenMenu(false); router.push(`/reviews/${topic._id}`); };
  const requestRenameTopic = () => { setOpenMenu(false); setRenameValue(topic.topic || ""); setRenameModal(true); };
  const cancelRenameTopic  = () => { if (isRenamingTopic) return; setRenameModal(false); setRenameValue(""); };

  const confirmRenameTopic = async () => {
    const next = String(renameValue || "").trim();
    if (!next) { showMessage("Please enter a topic name", "error"); return; }
    if (next.toLowerCase() === topic.topic?.trim().toLowerCase()) { cancelRenameTopic(); return; }
    setIsRenamingTopic(true);
    try {
      const res = await fetch("/api/topic/rename", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usn, topicId: topic._id, newTopic: next }) });
      const data = await res.json();
      if (!res.ok) { showMessage(data.error || "Failed to rename topic", "error"); return; }
      await onRefreshSubjects();
      showMessage("Topic renamed successfully!", "success");
      cancelRenameTopic();
    } catch { showMessage("Error renaming topic", "error"); }
    finally { setIsRenamingTopic(false); }
  };

  const requestDeleteTopic = () => { setOpenMenu(false); setDeleteModal(true); };
  const cancelDeleteTopic  = () => { if (isDeletingTopic) return; setDeleteModal(false); };

  const confirmDeleteTopic = async () => {
    if (!usn) return;
    setIsDeletingTopic(true);
    try {
      const res = await fetch("/api/topic/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usn, subject, topic: topic.topic }) });
      const data = await res.json();
      if (!res.ok) { showMessage(data.error || "Failed to delete topic", "error"); return; }
      if (onTopicDelete) onTopicDelete(data.subjects);
      showMessage("Topic deleted successfully!", "success");
      setDeleteModal(false);
    } catch { showMessage("Error deleting topic", "error"); }
    finally { setIsDeletingTopic(false); }
  };

  const getValidImages = (images) => images.filter((img) => img && img.trim());
  const validImages    = getValidImages(topic.images || []);
  const filesForTopic  = filesMap[topicKey];
  const isMultipleFiles = Array.isArray(filesForTopic);

  return (
    <div className="tc-card">

      {/* ── Rename Modal ── */}
      {renameModal && (
        <div className="tc-modal-overlay" onClick={cancelRenameTopic}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-icon tc-modal-icon--edit"><FiEdit2 /></div>
            <h4 className="tc-modal-title">Rename topic</h4>
            <p className="tc-modal-desc">Enter a new name for <strong>{topic.topic}</strong>.</p>
            <input
              className="tc-modal-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New topic name"
              autoFocus
              disabled={!!isRenamingTopic}
              onKeyDown={(e) => { if (e.key === "Enter") confirmRenameTopic(); if (e.key === "Escape") cancelRenameTopic(); }}
            />
            <div className="tc-modal-actions">
              <button className="tc-modal-btn tc-modal-btn--cancel" onClick={cancelRenameTopic} disabled={!!isRenamingTopic}>Cancel</button>
              <button className="tc-modal-btn tc-modal-btn--save"   onClick={confirmRenameTopic} disabled={!!isRenamingTopic}>
                {isRenamingTopic ? <><FiLoader className="tc-spin" /> Saving…</> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Topic Modal ── */}
      {deleteModal && (
        <div className="tc-modal-overlay" onClick={cancelDeleteTopic}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-icon tc-modal-icon--danger"><FiTrash2 /></div>
            <h4 className="tc-modal-title">Delete topic?</h4>
            <p className="tc-modal-desc">Delete <strong>{topic.topic}</strong>? This can't be undone.</p>
            <div className="tc-modal-actions">
              <button className="tc-modal-btn tc-modal-btn--cancel" onClick={cancelDeleteTopic} disabled={!!isDeletingTopic}>Cancel</button>
              <button className="tc-modal-btn tc-modal-btn--danger" onClick={confirmDeleteTopic} disabled={!!isDeletingTopic}>
                {isDeletingTopic ? <><FiLoader className="tc-spin" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Image Modal ── */}
      {deleteConfirm.show && (
        <div className="tc-modal-overlay" onClick={cancelDelete}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-icon tc-modal-icon--danger"><FiAlertTriangle /></div>
            <h4 className="tc-modal-title">Delete image?</h4>
            <p className="tc-modal-desc">This action cannot be undone.</p>
            <div className="tc-modal-actions">
              <button className="tc-modal-btn tc-modal-btn--cancel" onClick={cancelDelete}>Cancel</button>
              <button className="tc-modal-btn tc-modal-btn--danger" onClick={confirmDelete} disabled={isLoading}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          HEADER
      ══════════════════════════════════ */}
      <div
        className={`tc-header ${isCollapsed ? "tc-header--collapsed" : "tc-header--expanded"}`}
        role="button"
        aria-expanded={!isCollapsed}
        tabIndex={0}
        onClick={(e) => { if (shouldIgnore(e.target)) return; toggleCollapse(e); }}
        onKeyDown={(e) => { if (shouldIgnore(e.target)) return; if (e.key === "Enter" || e.key === " ") toggleCollapse(e); }}
      >
        <div className="tc-header-left">
          <span className="tc-caret">
            {isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
          </span>
          <span className="tc-topic-icon"><FiFileText /></span>
          <div className="tc-title-wrap">
            {isCollapsed ? (
              <h4 className="tc-title">{topic.topic}</h4>
            ) : (
              <Link href={`/works/${topic._id}`} className="tc-title-link" onClick={(e) => e.stopPropagation()}>
                <h4 className="tc-title">{topic.topic}</h4>
              </Link>
            )}
          </div>
        </div>

        <div className="tc-header-right">
          <span className="tc-date">
            <FiCalendar className="tc-date-icon" />
            {new Date(topic.timestamp).toLocaleDateString()}
          </span>

          <span className={`tc-badge ${topic.public ? "tc-badge--public" : "tc-badge--private"}`}>
            {topic.public ? "Public" : "Private"}
          </span>

          <div className="tc-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className={`tc-menu-btn${openMenu ? " tc-menu-btn--active" : ""}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenu((p) => !p); }}
              aria-label="More options"
              aria-expanded={openMenu}
            >
              <FiMoreVertical />
            </button>

            {openMenu && (
              <div className="tc-dropdown" onClick={(e) => e.stopPropagation()}>
                <button className="tc-dropdown-item" onClick={handleOpenTopic}>
                  <FiFileText className="tc-dropdown-icon" /><span>Open</span>
                </button>
                <button className="tc-dropdown-item" onClick={handleOpenReviews}>
                  <FiMessageSquare className="tc-dropdown-icon" /><span>Reviews</span>
                </button>
                <button className="tc-dropdown-item" onClick={requestRenameTopic}>
                  <FiEdit2 className="tc-dropdown-icon" /><span>Rename</span>
                </button>
                <button className="tc-dropdown-item" onClick={handleShare}>
                  <FiShare2 className="tc-dropdown-icon" /><span>Share</span>
                </button>
                <button className="tc-dropdown-item" onClick={handlePublicToggle} disabled={isLoading || isTogglingPublic}>
                  {topic.public ? <FiLock className="tc-dropdown-icon" /> : <FiUnlock className="tc-dropdown-icon" />}
                  <span>{isTogglingPublic ? "Processing…" : topic.public ? "Make Private" : "Make Public"}</span>
                </button>
                <div className="tc-dropdown-divider" />
                <button className="tc-dropdown-item tc-dropdown-item--danger" onClick={requestDeleteTopic}>
                  <FiTrash2 className="tc-dropdown-icon" /><span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          EXPANDED BODY
      ══════════════════════════════════ */}
      {!isCollapsed && (
        <div className="tc-body">

          {/* Images */}
          <div className="tc-section">
            <div className="tc-section-header">
              <FiImage className="tc-section-icon tc-section-icon--sky" />
              <span className="tc-section-title">Images</span>
              <span className="tc-count-badge">{validImages.length}</span>
            </div>

            {validImages.length > 0 && (
              <>
                <div className="tc-images-grid">
                  {validImages
                    .slice(0, expandedImages[topicKey] ? validImages.length : 3)
                    .map((img, i) => (
                      <div key={i} className="tc-image-tile">
                        <img src={img} alt={`Image ${i + 1}`} className="tc-image" loading="lazy" />
                        <div className="tc-image-overlay">
                          <button className="tc-image-delete-btn" onClick={() => showDeleteConfirmation(img)} disabled={isLoading}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {validImages.length > 3 && (
                  <button className="tc-ghost-btn tc-ghost-btn--sm tc-expand-btn" onClick={toggleImageExpansion}>
                    {expandedImages[topicKey]
                      ? <><FiChevronUp /> Show less</>
                      : <><FiChevronDown /> View {validImages.length - 3} more</>}
                  </button>
                )}
              </>
            )}

            {validImages.length === 0 && <p className="tc-empty-hint">No images yet.</p>}
          </div>

          {/* Upload */}
          <div className="tc-section">
            <div className="tc-section-header">
              <FiUpload className="tc-section-icon tc-section-icon--yellow" />
              <span className="tc-section-title">Add Content</span>
            </div>

            <button className="tc-ghost-btn" onClick={toggleCaptureOptions}>
              <FiCamera />
              {showCaptureOptions[topicKey] ? "Hide options" : "Add images / PDF"}
              {showCaptureOptions[topicKey] ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {showCaptureOptions[topicKey] && (
              <div className="tc-capture-bar">
                <button className="tc-pill-btn" onClick={triggerCameraCapture} disabled={isLoading || compressionStates[topicKey]}>
                  <FiCamera /> Capture Photo
                </button>
                <label className={`tc-pill-btn${(isLoading || compressionStates[topicKey]) ? " tc-pill-btn--disabled" : ""}`}>
                  <FiFile /> Browse Images
                  <input type="file" multiple onChange={handleMultipleFileChange} accept="image/*" className="tc-hidden-input" disabled={isLoading || compressionStates[topicKey]} />
                </label>
                <button className="tc-pill-btn" onClick={togglePDFProcessor} disabled={isLoading}>
                  <FiFileText /> Upload PDF/DOCX
                </button>
                <input ref={(el) => (cameraInputRefs.current[topicKey] = el)} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="tc-hidden-input" />
              </div>
            )}

            {showPDFProcessor[topicKey] && (
              <div className="tc-pdf-wrap">
                <PDFProcessor usn={usn} subject={subject} topic={topic.topic} onClose={togglePDFProcessor} onUploadSuccess={handlePDFUploadSuccess} onUploadError={(e) => showMessage(`PDF upload failed: ${e}`, "error")} />
              </div>
            )}

            {compressionStates[topicKey] && (
              <div className="tc-status-row">
                <FiLoader className="tc-spin tc-status-icon" />
                <span>Processing images…</span>
              </div>
            )}

            {uploadComplete[topicKey] && (
              <div className="tc-success-banner">
                <FiCheckCircle className="tc-success-icon" />
                <span>All images uploaded successfully!</span>
              </div>
            )}

            {/* Multiple files */}
            {isMultipleFiles && filesForTopic?.length > 0 && !uploadComplete[topicKey] && (
              <div className="tc-multi-wrap">
                <div className="tc-multi-grid">
                  {filesForTopic.map((fd, i) => {
                    const done = uploadedFiles[topicKey]?.has(i + 1);
                    return (
                      <div key={i} className={`tc-file-card${done ? " tc-file-card--done" : ""}`}>
                        <div className="tc-file-card-img-wrap">
                          <img src={filePreviewMap[topicKey]?.[i]} alt={`Preview ${i + 1}`} className="tc-file-thumb" />
                          {done && <span className="tc-file-done-check"><FiCheck /></span>}
                        </div>
                        <div className="tc-file-card-footer">
                          <span className="tc-file-name">{fd.name}</span>
                          <span className="tc-file-size">{(fd.compressedSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!uploadingStates[topicKey] && (
                  <button className="tc-primary-btn" onClick={uploadMultipleFilesSequentially} disabled={isLoading}>
                    <FiUpload /> Upload all ({filesForTopic.length})
                  </button>
                )}

                {uploadingStates[topicKey] && (
                  <div className="tc-progress-wrap">
                    <div className="tc-progress-track">
                      <div className="tc-progress-bar" style={{ width: `${uploadProgress[topicKey] || 0}%` }} />
                    </div>
                    <span className="tc-progress-label">{uploadProgress[topicKey] || 0}% completed</span>
                  </div>
                )}
              </div>
            )}

            {/* Single file */}
            {!isMultipleFiles && filePreviewMap[topicKey] && !uploadComplete[topicKey] && (
              <div className="tc-single-preview">
                <div className="tc-single-thumb-wrap">
                  <img src={filePreviewMap[topicKey]} alt="Preview" className="tc-single-thumb" />
                  <button className="tc-single-remove" onClick={() => handleSingleFileChange(null)} disabled={isLoading || compressionStates[topicKey]}>
                    <FiX />
                  </button>
                </div>
                <button className="tc-primary-btn" onClick={handleUploadImage} disabled={uploadingStates[topicKey] || !filesMap[topicKey] || compressionStates[topicKey]}>
                  {uploadingStates[topicKey]
                    ? <><FiLoader className="tc-spin" /> Uploading…</>
                    : <><FiUpload /> Upload</>}
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}