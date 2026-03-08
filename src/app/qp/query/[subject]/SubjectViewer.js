"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  FaImage,
  FaArrowLeft,
  FaListOl,
  FaShare,
  FaDownload,
  FaClipboardList,
} from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import questionPapersData from "../../questionPapersData";
import ImageLoader from "../../../components/ImageLoader";
import "./SubjectViewer.css";

/* ── helpers ── */
const getImagesBySubject = (subject) => {
  const images = [];
  for (const sem of questionPapersData) {
    for (const batch of sem.batches) {
      for (const examKey of ["mse1", "mse2", "final"]) {
        const exam = batch[examKey];
        const urls = exam?.imageurls?.[subject];
        if (Array.isArray(urls)) images.push(...urls.filter(Boolean));
      }
    }
  }
  return images;
};

const decodeSubject = (slug) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};

/* ── Lightbox ── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

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
    <div className="sv-lb-overlay" onClick={onClose}>
      <button className="sv-lb-close" onClick={onClose} aria-label="Close">
        <FiX size={22} />
      </button>
      <button
        className="sv-lb-nav sv-lb-prev"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Previous"
      >
        <FiChevronLeft size={26} />
      </button>
      <div className="sv-lb-img-wrap" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[idx]} alt={`Page ${idx + 1}`} className="sv-lb-img" />
        <div className="sv-lb-counter">
          Page {idx + 1} / {images.length}
        </div>
      </div>
      <button
        className="sv-lb-nav sv-lb-next"
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Next"
      >
        <FiChevronRight size={26} />
      </button>
    </div>
  );
}

/* ── Main component ── */
export default function SubjectViewer({ params }) {
  const { subject: subjectSlug } = use(params);
  const subject = decodeSubject(subjectSlug);
  const images = getImagesBySubject(subject);

  const [expandedImages, setExpandedImages] = useState({});
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  /* download range modal */
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [allPages, setAllPages] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);
  const [visiblePageCount, setVisiblePageCount] = useState(10);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(images.length || 1);

  const hasImages = images.length > 0;

  const toggleImageExpansion = (index) => {
    setExpandedImages((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  /* ── download PDF ── */
  const downloadAsPDF = async (options = {}) => {
    if (!hasImages) return;
    let pagesToDownload = images;
    if (!options.allPages) {
      if (options.selectedPages?.length) {
        pagesToDownload = options.selectedPages.map((i) => images[i - 1]).filter(Boolean);
      } else if (options.startPage && options.endPage) {
        pagesToDownload = images.slice(options.startPage - 1, options.endPage);
      }
    }
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < pagesToDownload.length; i++) {
        const res = await fetch(pagesToDownload[i]);
        const blob = await res.blob();
        const b64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(b64, "JPEG", 0, 0, pw, ph);
      }
      pdf.save(`${subject}_All_QP_LEARNIX.pdf`.replace(/\s+/g, "_"));
    } catch {
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const openRangeModal = () => {
    setStartPage(1);
    setEndPage(images.length);
    setAllPages(true);
    setCustomMode(false);
    setSelectedPages([]);
    setVisiblePageCount(10);
    setRangeModalOpen(true);
  };

  const closeRangeModal = () => setRangeModalOpen(false);

  const handleRangeDownload = (e) => {
    e.preventDefault();
    const total = images.length;
    const start = Math.max(1, Math.min(total, Number(startPage) || 1));
    const end = Math.max(start, Math.min(total, Number(endPage) || total));
    if (customMode) {
      const unique = [...new Set(selectedPages)].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
      if (!unique.length) return;
      downloadAsPDF({ allPages: false, selectedPages: unique });
    } else {
      downloadAsPDF({ allPages, startPage: start, endPage: end });
    }
    closeRangeModal();
  };

  const toggleAllPages = (checked) => {
    setAllPages(checked);
    if (checked) { setCustomMode(false); setSelectedPages([]); setStartPage(1); setEndPage(images.length || 1); }
  };

  const toggleCustomMode = (checked) => {
    setCustomMode(checked);
    if (checked) setAllPages(false);
    else setSelectedPages([]);
  };

  const togglePageSelection = (num) => {
    setSelectedPages((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  /* ── share ── */
  const handleShare = async () => {
    const url = window.location.href;
    const text = `📄 ${subject} — All Question Papers\n\n🔗 ${url}\n\n📚 LEARNIX`;
    if (navigator.share) {
      try { await navigator.share({ title: `${subject} QP | LEARNIX`, text: `${subject} - All QPs`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert("Link copied!"); } catch {}
    }
  };

  return (
    <div className="sv-container">
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      <div className="sv-main-content">
        {/* Header */}
        <div className="sv-header-section">
          <div className="sv-header-icon-wrap">
            <FaClipboardList className="sv-header-icon" />
          </div>
          <div className="sv-header-info">
            <h1 className="sv-title">{subject}</h1>
            <p className="sv-subtitle">All question papers for this subject across all semesters & batches</p>
          </div>
        </div>

        {/* Action buttons — same pattern as qpd */}
        <div className="sv-action-buttons-container">
          <Link href="/qp" className="sv-action-btn sv-back-btn">
            <FaArrowLeft />
            <span className="sv-btn-text">Back</span>
          </Link>
          <div className="sv-download-wrapper">
            <button
              onClick={() => downloadAsPDF({ allPages: true })}
              className="sv-action-btn sv-download-btn sv-download-primary"
              disabled={!hasImages}
              title="Download all as PDF"
            >
              <FaDownload />
              <span className="sv-btn-text">Download</span>
            </button>
            <button
              type="button"
              onClick={openRangeModal}
              className="sv-action-btn sv-download-btn sv-download-caret"
              disabled={!hasImages}
              title="Download selected pages"
            >
              <FaChevronDown />
            </button>
          </div>
          <button
            onClick={handleShare}
            className="sv-action-btn sv-share-btn"
            title="Share"
          >
            <FaShare />
            <span className="sv-btn-text">Share</span>
          </button>
        </div>

        {/* Content */}
        <div className="sv-content-section">
          {hasImages ? (
            <div className="sv-images-section">
              <div className="sv-images-header">
                <h3>
                  <FaImage className="sv-section-icon" />
                  Pages ({images.length})
                </h3>
                <div className="sv-images-header-controls">
                  {/* Slideshow */}
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="sv-slideshow-btn"
                    title="View slideshow from page 1"
                  >
                    <FiChevronRight className="sv-toggle-icon" aria-hidden="true" />
                    <span className="sv-toggle-label">Slideshow</span>
                  </button>
                  {/* Page # toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPageNumbers((v) => !v)}
                    className={`sv-page-toggle ${showPageNumbers ? "sv-page-toggle-active" : ""}`}
                    aria-pressed={showPageNumbers}
                    title={showPageNumbers ? "Hide page numbers" : "Show page numbers"}
                  >
                    <span className="sv-toggle-switch" aria-hidden="true">
                      <span className="sv-toggle-knob" />
                    </span>
                    <FaListOl className="sv-toggle-icon" aria-hidden="true" />
                    <span className="sv-toggle-label">Page #</span>
                  </button>
                </div>
              </div>

              <div className="sv-images-grid">
                {images.map((imageUrl, index) => (
                  <React.Fragment key={index}>
                    <div className="sv-image-container">
                      {showPageNumbers && (
                        <span className="sv-page-badge">{index + 1}</span>
                      )}
                      <div className="sv-image-wrapper">
                        <ImageLoader
                          src={imageUrl}
                          alt={`${subject} - Page ${index + 1}`}
                          className={`sv-topic-image ${expandedImages[index] ? "sv-expanded" : ""}`}
                          onClick={() => toggleImageExpansion(index)}
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {/* Ad slot every 6 pages */}
                    {(index + 1) % 6 === 0 && (
                      <div className="sv-ad-slot" key={`ad-${index}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="sv-no-images">
              <FaImage className="sv-no-images-icon" />
              <p>No images found for <strong>{subject}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sv-footer">
        <p>&copy; 2025 LEARNIX. All rights reserved.</p>
      </div>

      {/* Download range modal */}
      {rangeModalOpen && (
        <div className="sv-modal-overlay" role="dialog" aria-modal="true">
          <div className="sv-modal">
            <div className="sv-modal-header">
              <h3>Download pages</h3>
              <button className="sv-modal-close" onClick={closeRangeModal} aria-label="Close">×</button>
            </div>
            <form className="sv-modal-body" onSubmit={handleRangeDownload}>
              <div className="sv-modal-row">
                <label className="sv-input-group">
                  <span>From</span>
                  <input type="number" min={1} max={images.length} value={startPage}
                    onChange={(e) => { setStartPage(e.target.value); setAllPages(false); setCustomMode(false); }}
                    disabled={allPages || customMode}
                  />
                </label>
                <label className="sv-input-group">
                  <span>To</span>
                  <input type="number" min={1} max={images.length} value={endPage}
                    onChange={(e) => { setEndPage(e.target.value); setAllPages(false); setCustomMode(false); }}
                    disabled={allPages || customMode}
                  />
                </label>
              </div>
              <div className="sv-checkbox-stack">
                <label className="sv-checkbox">
                  <input type="checkbox" checked={allPages} onChange={(e) => toggleAllPages(e.target.checked)} />
                  <span>All pages ({images.length})</span>
                </label>
                <label className="sv-checkbox">
                  <input type="checkbox" checked={customMode} onChange={(e) => toggleCustomMode(e.target.checked)} disabled={allPages} />
                  <span>Select specific pages</span>
                </label>
              </div>
              {customMode && (
                <div className="sv-page-picker">
                  <div className="sv-page-grid">
                    {Array.from({ length: Math.min(visiblePageCount, images.length) }, (_, i) => i + 1).map((num) => (
                      <label key={num} className={`sv-page-chip ${selectedPages.includes(num) ? "sv-page-chip-active" : ""}`}>
                        <input type="checkbox" checked={selectedPages.includes(num)} onChange={() => togglePageSelection(num)} />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  {visiblePageCount < images.length && (
                    <button type="button" className="sv-secondary-btn sv-view-more"
                      onClick={() => setVisiblePageCount((p) => Math.min(p + 10, images.length))}>
                      View more {Math.min(10, images.length - visiblePageCount)}
                    </button>
                  )}
                </div>
              )}
              <div className="sv-modal-actions">
                <button type="button" className="sv-secondary-btn" onClick={closeRangeModal}>Cancel</button>
                <button type="submit" className="sv-primary-btn">
                  <FaDownload />
                  <span>Download</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
