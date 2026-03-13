"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowLeft, FiTrash2, FiAlertTriangle, FiX, FiCheck,
  FiMove, FiSave, FiLoader, FiImage, FiEye, FiChevronLeft,
  FiChevronRight, FiAlertCircle,
} from "react-icons/fi";
import "./TopicEditPage.css";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────
   Toast
───────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`tep-toast tep-toast--${toast.type}`}>{toast.msg}</div>;
}

/* ─────────────────────────────────────────
   Lightbox (fullscreen preview)
───────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length]); // eslint-disable-line

  return (
    <div className="tep-lb-overlay" onClick={onClose}>
      <button className="tep-lb-close" onClick={onClose}><FiX size={22} /></button>
      <button className="tep-lb-nav tep-lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>
        <FiChevronLeft size={26} />
      </button>
      <div className="tep-lb-img-wrap" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[idx]} alt={`Page ${idx + 1}`} className="tep-lb-img" />
        <div className="tep-lb-counter">Page {idx + 1} / {images.length}</div>
      </div>
      <button className="tep-lb-nav tep-lb-next" onClick={e => { e.stopPropagation(); next(); }}>
        <FiChevronRight size={26} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
function EditSkeleton() {
  return (
    <div className="tep-skeleton">
      <div className="tep-sk-box tep-sk-title" />
      <div className="tep-sk-grid">
        {[1,2,3,4,5,6].map(i => <div key={i} className="tep-sk-box tep-sk-card" />)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function TopicEditPage({ params }) {
  const { topicId } = use(params);

  const [token, setToken]     = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const [topic, setTopic]     = useState(null);
  const [subject, setSubject] = useState(null);
  const [images, setImages]   = useState([]); // working copy for reorder
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  /* delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null); // image url
  const [deleting, setDeleting]         = useState(false);

  /* reorder state */
  const [isDirty, setIsDirty]     = useState(false); // images changed from saved
  const [saving, setSaving]       = useState(false);
  const [selectedIdxs, setSelectedIdxs] = useState(new Set()); // selected page indices
  const [insertAfter, setInsertAfter]   = useState(null); // index to insert after (-1 = beginning)
  const [selectionMode, setSelectionMode] = useState(false); // are we in select mode?

  /* custom page-number inputs for insert position */
  const [afterPageInput, setAfterPageInput] = useState("");
  const [beforePageInput, setBeforePageInput] = useState("");

  /* lightbox */
  const [lightbox, setLightbox] = useState(null); // index

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── bootstrap ── */
  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  /* ── fetch topic ── */
  const fetchTopic = useCallback(async (tok) => {
    if (!tok) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/topic/edit/${topicId}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load topic"); return; }
      setTopic(data.topic);
      setSubject(data.subject);
      setImages(data.topic.images || []);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [topicId]);

  useEffect(() => { fetchTopic(token); }, [token, fetchTopic]);

  /* detect dirty */
  useEffect(() => {
    if (!topic) return;
    const orig = topic.images || [];
    const same = orig.length === images.length && orig.every((u, i) => u === images[i]);
    setIsDirty(!same);
  }, [images, topic]);

  /* ── delete image ── */
  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/topic/edit/${topicId}/image`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: deleteTarget }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to delete", "error"); return; }
      const next = images.filter(u => u !== deleteTarget);
      setImages(next);
      setTopic(prev => ({ ...prev, images: next }));
      setSelectedIdxs(new Set());
      setInsertAfter(null);
      setDeleteTarget(null);
      showToast("Image deleted");
    } catch { showToast("Network error", "error"); }
    finally { setDeleting(false); }
  };

  /* ── save reorder ── */
  const saveOrder = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`/api/topic/edit/${topicId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to save", "error"); return; }
      setTopic(prev => ({ ...prev, images }));
      setIsDirty(false);
      setSelectedIdxs(new Set());
      setInsertAfter(null);
      setAfterPageInput("");
      setBeforePageInput("");
      setSelectionMode(false);
      showToast("Order saved!");
    } catch { showToast("Network error", "error"); }
    finally { setSaving(false); }
  };

  /* ── reset order ── */
  const resetOrder = () => {
    setImages(topic?.images || []);
    setSelectedIdxs(new Set());
    setInsertAfter(null);
    setAfterPageInput("");
    setBeforePageInput("");
    setSelectionMode(false);
  };

  /* ── toggle selection ── */
  const toggleSelect = (idx) => {
    setSelectedIdxs(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  /* ── apply move ── */
  const applyMove = () => {
    if (selectedIdxs.size === 0 || insertAfter === null) return;

    const selected  = [...selectedIdxs].sort((a, b) => a - b);
    const remaining = images.filter((_, i) => !selectedIdxs.has(i));
    const pickedImgs = selected.map(i => images[i]);

    // insertAfter is the index in the ORIGINAL array that we insert after
    // We need to map it to the position in `remaining`
    // Count how many selected items are at index <= insertAfter
    const selectedBeforeOrAt = selected.filter(i => i <= insertAfter).length;
    const insertInRemaining  = insertAfter + 1 - selectedBeforeOrAt;

    const next = [
      ...remaining.slice(0, insertInRemaining),
      ...pickedImgs,
      ...remaining.slice(insertInRemaining),
    ];

    setImages(next);
    setSelectedIdxs(new Set());
    setInsertAfter(null);
    setAfterPageInput("");
    setBeforePageInput("");
  };

  /* ── drag & drop (mouse only, desktop) ── */
  const dragIdx = useRef(null);

  const onDragStart = (e, idx) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const next = [...images];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, moved);
    setImages(next);
    dragIdx.current = null;
  };

  if (!isLoaded) return null;

  const validImages = images.filter(u => u && u.trim());

  return (
    <div className="tep-wrapper">
      <Toast toast={toast} />

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox images={validImages} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="tep-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="tep-modal" onClick={e => e.stopPropagation()}>
            <div className="tep-modal-icon"><FiAlertTriangle size={28} /></div>
            <h3 className="tep-modal-title">Delete this image?</h3>
            <p className="tep-modal-text">This will permanently remove it from Cloudinary and cannot be undone.</p>
            {/* Preview thumbnail */}
            <div className="tep-modal-thumb-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deleteTarget} alt="To delete" className="tep-modal-thumb" />
            </div>
            <div className="tep-modal-actions">
              <button className="tep-btn tep-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="tep-btn tep-btn-danger" onClick={doDelete} disabled={deleting}>
                {deleting ? <><FiLoader className="tep-spin" /> Deleting…</> : <><FiTrash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slim header ── */}
      <header className="tep-header">
        <Link href="/upload" className="tep-back-link">
          <FiArrowLeft size={14} /> Back to Upload
        </Link>
        <div className="tep-header-right">
          <span className="tep-header-title">
            <FiImage size={15} /> Edit Mode
          </span>
          {topic && (
            <Link href={`/works/${topicId}`} className="tep-view-link" target="_blank">
              <FiEye size={13} /> View
            </Link>
          )}
        </div>
      </header>

      {/* ── Topic info ── */}
      {topic && (
        <div className="tep-topic-info">
          <span className="tep-topic-name">{topic.topic}</span>
          {subject && <span className="tep-subject-name">{subject.subject}</span>}
          <span className="tep-topic-date">{formatDate(topic.timestamp)}</span>
          <span className={`tep-badge ${
            (topic.visibility || "public") === "public"
              ? "tep-badge-pub"
              : (topic.visibility || "public") === "private"
                ? "tep-badge-priv"
                : "tep-badge-unlisted"
          }`}>
            {(topic.visibility || "public").charAt(0).toUpperCase() + (topic.visibility || "public").slice(1)}
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="tep-error">
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <EditSkeleton />}

      {/* ── Main content ── */}
      {!loading && !error && topic && (
        <>
          {/* Toolbar */}
          <div className="tep-toolbar">
            <div className="tep-toolbar-left">
              <span className="tep-page-count">{validImages.length} page{validImages.length !== 1 ? "s" : ""}</span>
              <button
                className={`tep-tool-btn ${selectionMode ? "tep-tool-btn--active" : ""}`}
                onClick={() => { setSelectionMode(v => !v); setSelectedIdxs(new Set()); setInsertAfter(null); }}
              >
                <FiMove size={14} /> {selectionMode ? "Exit Reorder" : "Reorder Pages"}
              </button>
            </div>

            <div className="tep-toolbar-right">
              {isDirty && (
                <>
                  <button className="tep-tool-btn tep-tool-btn--ghost" onClick={resetOrder} disabled={saving}>
                    <FiX size={14} /> Reset
                  </button>
                  <button className="tep-tool-btn tep-tool-btn--save" onClick={saveOrder} disabled={saving}>
                    {saving ? <><FiLoader className="tep-spin" size={13} /> Saving…</> : <><FiSave size={13} /> Save Order</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reorder instruction */}
          {selectionMode && (
            <div className="tep-reorder-help">
              <span>
                <strong>Step 1:</strong> Click pages to select them.&nbsp;
                <strong>Step 2:</strong> Set insert position (click card buttons or type below).&nbsp;
                <strong>Step 3:</strong> Hit <strong>Apply Move</strong>. You can also <strong>drag & drop</strong> individually.
              </span>
              {selectedIdxs.size > 0 && (
                <div className="tep-insert-inputs">
                  <label className="tep-insert-label">
                    Insert after page:
                    <input
                      type="number"
                      min="0"
                      max={validImages.length}
                      value={afterPageInput}
                      placeholder="0 = beginning"
                      className="tep-insert-input"
                      onChange={e => {
                        const raw = e.target.value;
                        setAfterPageInput(raw);
                        setBeforePageInput("");
                        const n = parseInt(raw, 10);
                        if (!isNaN(n) && n >= 0 && n <= validImages.length) {
                          setInsertAfter(n - 1); // 0 → -1 (before first), 1 → index 0, etc.
                        } else {
                          setInsertAfter(null);
                        }
                      }}
                    />
                  </label>
                  <span className="tep-insert-or">or</span>
                  <label className="tep-insert-label">
                    Insert before page:
                    <input
                      type="number"
                      min="1"
                      max={validImages.length}
                      value={beforePageInput}
                      placeholder={`1–${validImages.length}`}
                      className="tep-insert-input"
                      onChange={e => {
                        const raw = e.target.value;
                        setBeforePageInput(raw);
                        setAfterPageInput("");
                        const n = parseInt(raw, 10);
                        if (!isNaN(n) && n >= 1 && n <= validImages.length) {
                          setInsertAfter(n - 2); // before page n = after page n-1; n=1 → -1
                        } else {
                          setInsertAfter(null);
                        }
                      }}
                    />
                  </label>
                  {insertAfter !== null && (
                    <button className="tep-apply-btn" onClick={applyMove}>
                      <FiCheck size={13} /> Apply Move ({selectedIdxs.size} page{selectedIdxs.size > 1 ? "s" : ""} → after page {insertAfter + 1})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Image grid ── */}
          {validImages.length === 0 && (
            <div className="tep-empty">
              <FiImage size={36} />
              <p>No images in this topic yet.</p>
            </div>
          )}

          <div className={`tep-grid ${selectionMode ? "tep-grid--reorder" : ""}`}>
            {validImages.map((url, idx) => {
              const isSelected = selectedIdxs.has(idx);
              return (
                <div
                  key={url}
                  className={`tep-card ${isSelected ? "tep-card--selected" : ""} ${selectionMode ? "tep-card--selectable" : ""}`}
                  draggable={selectionMode}
                  onDragStart={e => onDragStart(e, idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onClick={() => selectionMode ? toggleSelect(idx) : setLightbox(idx)}
                >
                  {/* Page number badge */}
                  <div className={`tep-page-num ${isSelected ? "tep-page-num--sel" : ""}`}>
                    {isSelected ? <FiCheck size={11} /> : idx + 1}
                  </div>

                  {/* Image */}
                  <div className="tep-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Page ${idx + 1}`}
                      className="tep-img"
                      loading="lazy"
                    />
                    {/* View hint overlay in normal mode */}
                    {!selectionMode && (
                      <div className="tep-img-view-hint">
                        <FiEye size={13} /> View
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="tep-card-footer">
                    <span className="tep-card-label">Page {idx + 1}</span>
                    <div className="tep-card-actions">
                      {/* Insert after (reorder mode) */}
                      {selectionMode && selectedIdxs.size > 0 && !isSelected && (
                        <button
                          className={`tep-insert-btn ${insertAfter === idx ? "tep-insert-btn--active" : ""}`}
                          onClick={e => { e.stopPropagation(); setInsertAfter(insertAfter === idx ? null : idx); }}
                          title={`Insert selected after page ${idx + 1}`}
                        >
                          {insertAfter === idx ? <FiCheck size={11} /> : "↓ after"}
                        </button>
                      )}
                      {/* Insert before first (reorder mode, page 1) */}
                      {selectionMode && selectedIdxs.size > 0 && !isSelected && idx === 0 && (
                        <button
                          className={`tep-insert-btn ${insertAfter === -1 ? "tep-insert-btn--active" : ""}`}
                          onClick={e => { e.stopPropagation(); setInsertAfter(insertAfter === -1 ? null : -1); }}
                          title="Insert before page 1"
                        >
                          {insertAfter === -1 ? <FiCheck size={11} /> : "↑ before"}
                        </button>
                      )}
                      {/* Delete button — only in normal mode */}
                      {!selectionMode && (
                        <button
                          className="tep-del-btn"
                          onClick={e => { e.stopPropagation(); setDeleteTarget(url); }}
                          title="Delete this image"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Apply bar when ready */}
          {selectionMode && selectedIdxs.size > 0 && insertAfter !== null && (
            <div className="tep-float-bar">
              Moving <strong>{selectedIdxs.size}</strong> page{selectedIdxs.size > 1 ? "s" : ""} →
              after page <strong>{insertAfter + 1}</strong>
              <button className="tep-apply-btn tep-apply-btn--lg" onClick={applyMove}>
                <FiCheck size={14} /> Apply Move
              </button>
              <button className="tep-float-cancel" onClick={() => { setSelectedIdxs(new Set()); setInsertAfter(null); setAfterPageInput(""); setBeforePageInput(""); }}>
                <FiX size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
