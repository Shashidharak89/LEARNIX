"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaDownload, 
  FaShare, 
  FaArrowLeft,
  FaImage,
  FaListOl,
  FaClipboardList,
  FaBookmark,
  FaGraduationCap,
  FaUniversity,
} from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { EyeIcon } from "@animateicons/react/lucide";
import { Navbar } from "../../components/Navbar";
import ImageSlideshowModal from "../../components/ImageSlideshowModal";
import {
  toggleLearnLaterClient,
  checkLearnLaterStatusClient,
  isItemInLearnLaterStorage,
} from "@/lib/clientLearnLater";
import "../[id]/styles/QuestionPaperDetail.css";

// Skeleton Components
const HeaderSkeleton = () => (
  <div className="qpd-header-section qpd-skeleton-container">
    <div className="qpd-header-info">
      <div className="qpd-skeleton-title"></div>
      <div className="qpd-header-meta">
        <div className="qpd-meta-item qpd-skeleton-meta">
          <div className="qpd-skeleton-text"></div>
        </div>
        <div className="qpd-meta-item qpd-skeleton-meta">
          <div className="qpd-skeleton-text"></div>
        </div>
      </div>
    </div>
  </div>
);

const ActionButtonsSkeleton = () => (
  <div className="qpd-action-buttons-container qpd-skeleton-container">
    <div className="qpd-action-btn qpd-skeleton-btn">
      <FaArrowLeft className="qpd-skeleton-icon" />
      <span className="qpd-btn-text qpd-skeleton-btn-text">Back</span>
    </div>
    <div className="qpd-action-btn qpd-skeleton-btn">
      <FaDownload className="qpd-skeleton-icon" />
      <span className="qpd-btn-text qpd-skeleton-btn-text">Download</span>
    </div>
    <div className="qpd-action-btn qpd-skeleton-btn">
      <FaShare className="qpd-skeleton-icon" />
      <span className="qpd-btn-text qpd-skeleton-btn-text">Share</span>
    </div>
  </div>
);

const ContentSkeleton = () => (
  <div className="qpd-content-section qpd-skeleton-container">
    <div className="qpd-images-section">
      <div className="qpd-images-header">
        <h3>
          <FaImage className="qpd-section-icon qpd-skeleton-icon" />
          <span className="qpd-skeleton-images-title"></span>
        </h3>
      </div>
      <div className="qpd-images-grid">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="qpd-image-container qpd-skeleton-image-container">
            <div className="qpd-image-wrapper">
              <div className="qpd-skeleton-image"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function QPFilterClient() {
  const searchParams = useSearchParams();
  const qpTargetId = searchParams.toString() || "filtered-qp";
  const [isSavedInLearnLater, setIsSavedInLearnLater] = useState(() => isItemInLearnLaterStorage("question-paper", qpTargetId));
  const [isLearnLaterLoading, setIsLearnLaterLoading] = useState(false);

  const [images, setImages] = useState([]);
  const [paperDetails, setPaperDetails] = useState({
    subjectName: "",
    collegeName: "",
    batchName: "",
    examName: "",
    courseName: "",
    semesterName: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedImages, setExpandedImages] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [allPages, setAllPages] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);
  const [visiblePageCount, setVisiblePageCount] = useState(10);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (qpTargetId) {
      if (isItemInLearnLaterStorage("question-paper", qpTargetId)) {
        setIsSavedInLearnLater(true);
      }
      checkLearnLaterStatusClient([{ type: "question-paper", targetId: qpTargetId }])
        .then((res) => {
          if (mounted && res) {
            if (res[`question-paper#${qpTargetId}`] || res[`question-paper:${qpTargetId}`] || res[qpTargetId]) {
              setIsSavedInLearnLater(true);
            } else if (res[`question-paper#${qpTargetId}`] === false || res[`question-paper:${qpTargetId}`] === false) {
              setIsSavedInLearnLater(false);
            }
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [qpTargetId]);

  useEffect(() => {
    const handleUpdate = (e) => {
      const eTargetId = e.detail?.item?.targetId || e.detail?.targetId;
      const eItemId = e.detail?.itemId;
      if (
        eTargetId === qpTargetId ||
        eItemId === `question-paper#${qpTargetId}` ||
        eItemId === `question-paper:${qpTargetId}`
      ) {
        if (e.detail?.isSaved !== undefined) {
          setIsSavedInLearnLater(e.detail.isSaved);
        }
      }
    };
    window.addEventListener("learnix:learn-later-updated", handleUpdate);
    return () => window.removeEventListener("learnix:learn-later-updated", handleUpdate);
  }, [qpTargetId]);

  useEffect(() => {
    const fetchFilteredData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new window.URLSearchParams(searchParams);
        params.set("limit", "100");

        const res = await fetch(`/api/qp/v1/images?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch filtered question papers");

        const json = await res.json();

        if (json.success && json.data) {
          if (json.data.length > 0) {
            const first = json.data[0];
            const subName = first.subject?.name || "";
            const collegeName = first.college?.name || "";
            const batchName = first.batch ? `${first.batch.startYear}-${first.batch.endYear}` : "";
            const examName = first.examtype?.name || "";
            const courseName = first.subject?.course?.name || "";
            const semesterName = first.subject?.semester?.semesterNumber ? `Semester ${first.subject.semester.semesterNumber}` : "";

            setPaperDetails({
              subjectName: subName,
              collegeName,
              batchName,
              examName,
              courseName,
              semesterName,
            });
          }

          let allImages = [];
          json.data.forEach((record) => {
            if (record.imageUrls && Array.isArray(record.imageUrls)) {
              allImages = [...allImages, ...record.imageUrls];
            }
          });

          const valid = allImages.filter((img) => img && typeof img === "string" && img.trim() !== "");
          setImages(valid);
          setEndPage(valid.length || 1);
        } else {
          setImages([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [searchParams]);

  const hasImages = images.length > 0;

  const toggleImageExpansion = (imageIndex) => {
    setExpandedImages((prev) => ({
      ...prev,
      [imageIndex]: !prev[imageIndex],
    }));
  };

  const togglePageNumbers = () => {
    setShowPageNumbers((prev) => !prev);
  };

  const openRangeModal = () => {
    if (!hasImages) return;
    setStartPage(1);
    setEndPage(images.length);
    setAllPages(true);
    setCustomMode(false);
    setSelectedPages([]);
    setVisiblePageCount(10);
    setRangeModalOpen(true);
  };

  const closeRangeModal = () => setRangeModalOpen(false);

  const downloadAsPDF = async (options = {}) => {
    if (!hasImages) {
      alert("No images available for download");
      return;
    }

    setDownloading(true);
    try {
      let pagesToDownload = images;
      if (options.allPages) {
        pagesToDownload = images;
      } else if (options.selectedPages && options.selectedPages.length > 0) {
        pagesToDownload = options.selectedPages.map((i) => images[i - 1]).filter(Boolean);
      } else if (options.startPage && options.endPage) {
        pagesToDownload = images.slice(options.startPage - 1, options.endPage);
      }

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;

      for (let i = 0; i < pagesToDownload.length; i++) {
        const imgUrl = pagesToDownload[i];
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        const img = new Image();
        img.src = base64;
        await new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });

        const imgW = img.naturalWidth || img.width || 1;
        const imgH = img.naturalHeight || img.height || 1;

        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;

        const scale = Math.min(maxW / imgW, maxH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;

        const x = (pageWidth - drawW) / 2;
        const y = (pageHeight - drawH) / 2;

        if (i > 0) pdf.addPage("a4", "p");

        const format = base64.includes("image/png") ? "PNG" : "JPEG";
        pdf.addImage(base64, format, x, y, drawW, drawH);
      }

      const fileTitle = (paperDetails.subjectName || paperDetails.examName || "Filtered_QP")
        .replace(/[^a-zA-Z0-9.-]/g, "_");
      pdf.save(`${fileTitle}_LEARNIX.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleRangeDownload = (e) => {
    e.preventDefault();
    const total = images.length;
    const start = Math.max(1, Math.min(total, Number(startPage) || 1));
    const end = Math.max(start, Math.min(total, Number(endPage) || total));

    if (customMode) {
      const uniqueSelected = Array.from(new Set(selectedPages))
        .filter((n) => n >= 1 && n <= total)
        .sort((a, b) => a - b);
      if (!uniqueSelected.length) return;
      downloadAsPDF({ allPages: false, selectedPages: uniqueSelected });
    } else {
      downloadAsPDF({ allPages, startPage: start, endPage: end });
    }

    setRangeModalOpen(false);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const titleText = paperDetails.subjectName || paperDetails.examName || "Question Papers";
    const shareText = `📄 Filtered Question Paper - ${titleText}\n\n🔗 View here: ${shareUrl}\n\n📚 LEARNIX - Your Study Companion`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${titleText} | LEARNIX`,
          text: `Filtered Question Paper - ${titleText}`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };

  const toggleCustomMode = (checked) => {
    setCustomMode(checked);
    if (checked) {
      setAllPages(false);
    } else {
      setSelectedPages([]);
    }
  };

  const toggleAllPages = (checked) => {
    setAllPages(checked);
    if (checked) {
      setCustomMode(false);
      setSelectedPages([]);
      setStartPage(1);
      setEndPage(images.length || 1);
    }
  };

  const togglePageSelection = (pageNumber) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageNumber)) {
        return prev.filter((n) => n !== pageNumber);
      }
      return [...prev, pageNumber].sort((a, b) => a - b);
    });
  };

  const showMorePages = () => {
    setVisiblePageCount((prev) => Math.min(prev + 10, images.length));
  };

  const displayTitle = paperDetails.subjectName || paperDetails.examName || "Filtered Question Papers";

  if (loading) {
    return (
      <div className="qpd-container">
        <Navbar />
        <div className="qpd-main-content">
          <HeaderSkeleton />
          <ActionButtonsSkeleton />
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div className="qpd-container">
        <Navbar />
        <div className="qpd-error-container">
          <div className="qpd-error-content">
            <FaClipboardList className="qpd-error-icon" />
            <h2>No Question Papers Found</h2>
            <p>{error || "No question papers matched all your selected filter criteria."}</p>
            <Link href="/qp" className="qpd-back-link">
              <FaArrowLeft /> Back to Question Papers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qpd-container">
      <Navbar />
      <div className="qpd-main-content">
        {/* Header Section */}
        <div className="qpd-header-section">
          <div className="qpd-header-icon-wrapper">
            <FaClipboardList className="qpd-header-icon" />
          </div>
          <div className="qpd-header-info">
            <h1 className="qpd-title">{displayTitle}</h1>
            <div className="qpd-header-meta">
              {paperDetails.collegeName && (
                <div className="qpd-meta-item" title="College">
                  <FaUniversity className="qpd-meta-icon" />
                  <span>{paperDetails.collegeName}</span>
                </div>
              )}
              {paperDetails.batchName && (
                <div className="qpd-meta-item" title="Batch">
                  <span className="qpd-batch-badge">{paperDetails.batchName}</span>
                </div>
              )}
              {paperDetails.examName && (
                <div className="qpd-meta-item" title="Exam Type">
                  <FaCalendarAlt className="qpd-meta-icon" />
                  <span>{paperDetails.examName}</span>
                </div>
              )}
              {paperDetails.semesterName && (
                <div className="qpd-meta-item" title="Semester">
                  <FaGraduationCap className="qpd-meta-icon" />
                  <span>{paperDetails.semesterName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="qpd-action-buttons-container">
          <Link href="/qp" className="qpd-action-btn qpd-back-btn">
            <FaArrowLeft />
            <span className="qpd-btn-text">Back</span>
          </Link>

          <div className="qpd-download-wrapper">
            <button 
              onClick={() => downloadAsPDF({ allPages: true })}
              className="qpd-action-btn qpd-download-btn qpd-download-primary"
              disabled={!hasImages || downloading}
              title="Download all pages as PDF"
            >
              <FaDownload />
              <span className="qpd-btn-text">{downloading ? "Generating..." : "Download"}</span>
            </button>
            <button
              type="button"
              onClick={openRangeModal}
              className="qpd-action-btn qpd-download-btn qpd-download-caret"
              disabled={!hasImages || downloading}
              title="Download selected pages"
            >
              <FaChevronDown />
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="qpd-action-btn qpd-share-btn"
            title="Share Question Paper"
          >
            <FaShare />
            <span className="qpd-btn-text">Share</span>
          </button>

          <button 
            onClick={async () => {
              if (isLearnLaterLoading) return;
              setIsLearnLaterLoading(true);
              try {
                const res = await toggleLearnLaterClient({
                  type: "question-paper",
                  targetId: qpTargetId,
                  title: displayTitle,
                  subtitle: paperDetails.batchName ? `Batch ${paperDetails.batchName}` : "Filtered Question Papers",
                  description: `Filtered question papers containing ${images.length} pages`,
                  url: `/qp/filter?${searchParams.toString()}`,
                  metadata: {
                    pageCount: images.length,
                    title: displayTitle,
                  },
                });
                if (res && res.success) {
                  setIsSavedInLearnLater(res.isSaved);
                }
              } finally {
                setIsLearnLaterLoading(false);
              }
            }}
            disabled={isLearnLaterLoading}
            className={`qpd-action-btn qpd-learn-later-btn ${isSavedInLearnLater ? "qpd-saved" : ""}`}
            title={isSavedInLearnLater ? "Remove from Learn Later" : "Save to Learn Later"}
          >
            <FaBookmark style={isSavedInLearnLater ? { fill: "#8b5cf6", color: "#8b5cf6" } : {}} />
            <span className="qpd-btn-text">{isSavedInLearnLater ? "Saved" : "Learn Later"}</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="qpd-content-section">
          {hasImages ? (
            <div className="qpd-images-section">
              <div className="qpd-images-header">
                <h3>
                  <FaImage className="qpd-section-icon" />
                  Pages ({images.length})
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="wtpc-slideshow-btn"
                    title="View slideshow"
                  >
                    <EyeIcon size={14} className="wtpc-toggle-icon" aria-hidden="true" />
                    <span className="wtpc-toggle-label">Slideshow</span>
                  </button>
                  <button
                    type="button"
                    onClick={togglePageNumbers}
                    className={`qpd-page-toggle ${showPageNumbers ? "qpd-page-toggle-active" : ""}`}
                    aria-pressed={showPageNumbers}
                    title={showPageNumbers ? "Hide page numbers" : "Show page numbers"}
                  >
                    <span className="qpd-toggle-switch" aria-hidden="true">
                      <span className="qpd-toggle-knob" />
                    </span>
                    <FaListOl className="qpd-toggle-icon" aria-hidden="true" />
                    <span className="qpd-toggle-label">Page #</span>
                  </button>
                </div>
              </div>

              <div className="qpd-images-grid">
                {images.map((imageUrl, index) => (
                  <div key={index} className="qpd-image-container">
                    {showPageNumbers && (
                      <span className="qpd-page-badge">{index + 1}</span>
                    )}
                    <div className="qpd-image-wrapper">
                      <img
                        src={imageUrl}
                        alt={`${displayTitle} - Page ${index + 1}`}
                        className={`qpd-topic-image ${expandedImages[index] ? "qpd-expanded" : ""}`}
                        onClick={() => setLightboxIndex(index)}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="qpd-no-images">
              <FaImage className="qpd-no-images-icon" />
              <p>No images available for this question paper</p>
            </div>
          )}
        </div>
      </div>

      {/* Slideshow Lightbox */}
      {lightboxIndex !== null && (
        <ImageSlideshowModal
          images={images}
          startIndex={lightboxIndex}
          title={displayTitle}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Footer */}
      <div className="qpd-footer">
        <p>&copy; {new Date().getFullYear()} LEARNIX. All rights reserved.</p>
      </div>

      {/* Download Range Modal */}
      {rangeModalOpen && (
        <div className="qpd-modal-overlay" role="dialog" aria-modal="true">
          <div className="qpd-modal">
            <div className="qpd-modal-header">
              <h3>Download pages</h3>
              <button className="qpd-modal-close" onClick={closeRangeModal} aria-label="Close">
                ×
              </button>
            </div>
            <form className="qpd-modal-body" onSubmit={handleRangeDownload}>
              <div className="qpd-modal-row">
                <label className="qpd-input-group">
                  <span>From</span>
                  <input
                    type="number"
                    min={1}
                    max={images.length}
                    value={startPage}
                    onChange={(e) => {
                      setStartPage(e.target.value);
                      setAllPages(false);
                      setCustomMode(false);
                    }}
                    disabled={allPages || customMode}
                  />
                </label>
                <label className="qpd-input-group">
                  <span>To</span>
                  <input
                    type="number"
                    min={1}
                    max={images.length}
                    value={endPage}
                    onChange={(e) => {
                      setEndPage(e.target.value);
                      setAllPages(false);
                      setCustomMode(false);
                    }}
                    disabled={allPages || customMode}
                  />
                </label>
              </div>

              <div className="qpd-checkbox-stack">
                <label className="qpd-checkbox">
                  <input
                    type="checkbox"
                    checked={allPages}
                    onChange={(e) => toggleAllPages(e.target.checked)}
                  />
                  <span>All pages ({images.length})</span>
                </label>

                <label className="qpd-checkbox">
                  <input
                    type="checkbox"
                    checked={customMode}
                    onChange={(e) => toggleCustomMode(e.target.checked)}
                  />
                  <span>Select custom pages</span>
                </label>
              </div>

              {customMode && (
                <div className="qpd-page-selection-wrapper">
                  <div className="qpd-page-chips">
                    {Array.from({ length: Math.min(visiblePageCount, images.length) }, (_, i) => i + 1).map((pageNumber) => {
                      const isSelected = selectedPages.includes(pageNumber);
                      return (
                        <button
                          type="button"
                          key={pageNumber}
                          onClick={() => togglePageSelection(pageNumber)}
                          className={`qpd-page-chip ${isSelected ? "qpd-page-chip-selected" : ""}`}
                          aria-pressed={isSelected}
                        >
                          Page {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  {visiblePageCount < images.length && (
                    <button
                      type="button"
                      className="qpd-more-pages-btn"
                      onClick={showMorePages}
                    >
                      Show more pages
                    </button>
                  )}
                </div>
              )}

              <div className="qpd-modal-actions">
                <button type="button" className="qpd-modal-btn qpd-secondary-btn" onClick={closeRangeModal}>
                  Cancel
                </button>
                <button type="submit" className="qpd-modal-btn qpd-primary-btn" disabled={downloading}>
                  {downloading ? "Generating..." : "Download"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
