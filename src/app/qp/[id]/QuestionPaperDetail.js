"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaDownload, 
  FaShare, 
  FaArrowLeft,
  FaImage,
  FaListOl,
  FaExternalLinkAlt,
  FaClipboardList
} from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import "./styles/QuestionPaperDetail.css";

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

const FullPageSkeleton = () => (
  <div className="qpd-container">
    <div className="qpd-main-content">
      <HeaderSkeleton />
      <ActionButtonsSkeleton />
      <ContentSkeleton />
    </div>
  </div>
);

const QuestionPaperDetail = ({ id, paperInfo }) => {
  const [expandedImages, setExpandedImages] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [allPages, setAllPages] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);
  const [visiblePageCount, setVisiblePageCount] = useState(10);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  if (!paperInfo) {
    return (
      <div className="qpd-error-container">
        <div className="qpd-error-content">
          <FaClipboardList className="qpd-error-icon" />
          <h2>Question Paper Not Found</h2>
          <p>The requested question paper could not be found.</p>
          <Link href="/qp" className="qpd-back-link">
            <FaArrowLeft /> Back to Question Papers
          </Link>
        </div>
      </div>
    );
  }

  const { examType, semester, batch, data } = paperInfo;
  const rawImages = Array.isArray(data?.imageurls) ? data.imageurls : [];
  const validImages = rawImages.filter((img) => img && img.trim() !== "");
  const hasImages = validImages.length > 0;
  const visitLinks = Array.isArray(data?.visitlink) ? data.visitlink : [];

  const handleImageLoad = (index) => {
    setTimeout(() => {
      setImageLoading(prev => ({ ...prev, [index]: false }));
    }, 500);
  };

  const handleImageStart = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: true }));
  };

  const toggleImageExpansion = (imageIndex) => {
    setExpandedImages(prev => ({
      ...prev,
      [imageIndex]: !prev[imageIndex]
    }));
  };

  const togglePageNumbers = () => {
    setShowPageNumbers((prev) => !prev);
  };

  const openRangeModal = () => {
    if (!hasImages || !validImages.length) return;
    setStartPage(1);
    setEndPage(validImages.length);
    setAllPages(true);
    setCustomMode(false);
    setSelectedPages([]);
    setVisiblePageCount(10);
    setRangeModalOpen(true);
  };

  const closeRangeModal = () => setRangeModalOpen(false);

  // Download images as PDF (client-side)
  const downloadAsPDF = async (options = {}) => {
    if (!hasImages || !validImages.length) {
      alert("No images available for download");
      return;
    }

    try {
      const downloadBtn = document.querySelector('.qpd-download-btn');
      if (downloadBtn) {
        downloadBtn.disabled = true;
        const btnText = downloadBtn.querySelector('.qpd-btn-text');
        if (btnText) btnText.textContent = 'Generating...';
      }

      // Determine which pages to download
      let pagesToDownload = [];
      if (options.allPages) {
        pagesToDownload = validImages;
      } else if (options.selectedPages && options.selectedPages.length > 0) {
        pagesToDownload = options.selectedPages.map(i => validImages[i - 1]).filter(Boolean);
      } else if (options.startPage && options.endPage) {
        pagesToDownload = validImages.slice(options.startPage - 1, options.endPage);
      } else {
        pagesToDownload = validImages;
      }

      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pagesToDownload.length; i++) {
        const imgUrl = pagesToDownload[i];
        
        // Fetch image and convert to base64
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        if (i > 0) pdf.addPage();
        
        // Add image to PDF
        pdf.addImage(base64, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      // Download the PDF
      const fileName = `${examType}_${semester}_${batch}_LEARNIX.pdf`.replace(/\s+/g, '_');
      pdf.save(fileName);

      // Reset button
      if (downloadBtn) {
        downloadBtn.disabled = false;
        const btnText = downloadBtn.querySelector('.qpd-btn-text');
        if (btnText) btnText.textContent = 'Download';
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      
      const downloadBtn = document.querySelector('.qpd-download-btn');
      if (downloadBtn) {
        downloadBtn.disabled = false;
        const btnText = downloadBtn.querySelector('.qpd-btn-text');
        if (btnText) btnText.textContent = 'Download';
      }
    }
  };

  const handleRangeDownload = (e) => {
    e.preventDefault();
    const total = validImages.length;
    const start = Math.max(1, Math.min(total, Number(startPage) || 1));
    const end = Math.max(start, Math.min(total, Number(endPage) || total));

    if (customMode) {
      const uniqueSelected = Array.from(new Set(selectedPages)).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
      if (!uniqueSelected.length) return;
      downloadAsPDF({ allPages: false, selectedPages: uniqueSelected });
    } else {
      downloadAsPDF({ allPages, startPage: start, endPage: end });
    }

    setRangeModalOpen(false);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `📄 Question Paper - ${semester} | Batch: ${batch} | ${examType}\n\n🔗 View here: ${shareUrl}\n\n📚 LEARNIX - Your Study Companion`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${examType} - ${semester} (${batch}) | LEARNIX`,
          text: `Question Paper - ${semester} | Batch: ${batch} | ${examType}`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard with full text
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Copy failed:', err);
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
      setEndPage(validImages.length || 1);
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
    setVisiblePageCount((prev) => Math.min(prev + 10, validImages.length));
  };

  return (
    <div className="qpd-container">
      <div className="qpd-main-content">
        {/* Header Section */}
        <div className="qpd-header-section">
          <div className="qpd-header-icon-wrapper">
            <FaClipboardList className="qpd-header-icon" />
          </div>
          <div className="qpd-header-info">
            <h1 className="qpd-title">{examType}</h1>
            <div className="qpd-header-meta">
              <div className="qpd-meta-item">
                <FaCalendarAlt className="qpd-meta-icon" />
                <span>{semester}</span>
              </div>
              <div className="qpd-meta-item">
                <span className="qpd-batch-badge">{batch}</span>
              </div>
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
              disabled={!hasImages || !validImages.length}
              title={!hasImages || !validImages.length ? "No images available for download" : "Download as PDF"}
            >
              <FaDownload />
              <span className="qpd-btn-text">Download</span>
            </button>
            <button
              type="button"
              onClick={openRangeModal}
              className="qpd-action-btn qpd-download-btn qpd-download-caret"
              disabled={!hasImages || !validImages.length}
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
        </div>

        {/* Content Section */}
        <div className="qpd-content-section">
          {/* Images Section */}
          {hasImages && validImages.length > 0 && (
            <div className="qpd-images-section">
              <div className="qpd-images-header">
                <h3>
                  <FaImage className="qpd-section-icon" />
                  Pages ({validImages.length})
                </h3>
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
              <div className="qpd-images-grid">
                {validImages.map((imageUrl, index) => (
                  <div key={index} className="qpd-image-container">
                    {showPageNumbers && (
                      <span className="qpd-page-badge">{index + 1}</span>
                    )}
                    <div className="qpd-image-wrapper">
                      {imageLoading[index] && (
                        <div className="qpd-image-loader">
                          <div className="qpd-loader-spinner"></div>
                          <span>Loading image...</span>
                        </div>
                      )}
                      <img 
                        src={imageUrl} 
                        alt={`${examType} - Page ${index + 1}`}
                        className={`qpd-topic-image ${expandedImages[index] ? 'qpd-expanded' : ''} ${imageLoading[index] ? 'qpd-loading' : ''}`}
                        onClick={() => toggleImageExpansion(index)}
                        loading="lazy"
                        onLoadStart={() => handleImageStart(index)}
                        onLoad={() => handleImageLoad(index)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasImages && (
            <div className="qpd-no-images">
              <FaImage className="qpd-no-images-icon" />
              <p>No images available for this question paper</p>
            </div>
          )}

          {/* Original Content Links */}
          {visitLinks.length > 0 && (
            <div className="qpd-original-links">
              <h3>
                <FaExternalLinkAlt className="qpd-section-icon" />
                View Original Content
              </h3>
              <div className="qpd-links-grid">
                {visitLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={`/works/${link}`}
                    className="qpd-original-link"
                  >
                    <FaExternalLinkAlt className="qpd-link-icon" />
                    <span>View Source {index + 1}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="qpd-footer">
        <p>&copy; 2025 Question Papers. All rights reserved.</p>
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
                    max={validImages.length}
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
                    max={validImages.length}
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
                  <span>All pages ({validImages.length})</span>
                </label>

                <label className="qpd-checkbox">
                  <input
                    type="checkbox"
                    checked={customMode}
                    onChange={(e) => toggleCustomMode(e.target.checked)}
                    disabled={allPages}
                  />
                  <span>Select specific pages</span>
                </label>
              </div>

              {customMode && (
                <div className="qpd-page-picker">
                  <div className="qpd-page-grid">
                    {Array.from({ length: Math.min(visiblePageCount, validImages.length) }, (_, idx) => idx + 1).map((num) => (
                      <label key={num} className={`qpd-page-chip ${selectedPages.includes(num) ? "qpd-page-chip-active" : ""}`}>
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(num)}
                          onChange={() => togglePageSelection(num)}
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  {visiblePageCount < validImages.length && (
                    <button type="button" className="qpd-secondary-btn qpd-view-more" onClick={showMorePages}>
                      View more {Math.min(10, validImages.length - visiblePageCount)}
                    </button>
                  )}
                </div>
              )}

              <div className="qpd-modal-actions">
                <button type="button" className="qpd-secondary-btn" onClick={closeRangeModal}>Cancel</button>
                <button type="submit" className="qpd-primary-btn">
                  <FaDownload />
                  <span className="qpd-btn-text">Download</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPaperDetail;
