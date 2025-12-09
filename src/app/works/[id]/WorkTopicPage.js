"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { 
  FaUser, 
  FaCalendarAlt, 
  FaBook, 
  FaDownload, 
  FaShare, 
  FaArrowLeft,
  FaImage,
  FaClock,
  FaIdCard,
  FaListOl
} from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import "./styles/WorkTopicPage.css";

// Skeleton Components
const UserProfileSkeleton = () => (
  <div className="wtpc-user-section wtpc-skeleton-container">
    <div className="wtpc-user-avatar">
      <div className="wtpc-skeleton-avatar"></div>
    </div>
    <div className="wtpc-user-info">
      <div className="wtpc-skeleton-user-name"></div>
      <div className="wtpc-user-details">
        <div className="wtpc-detail-item wtpc-skeleton-detail">
          <FaIdCard className="wtpc-detail-icon wtpc-skeleton-icon" />
          <div className="wtpc-skeleton-text"></div>
        </div>
        <div className="wtpc-detail-item wtpc-skeleton-detail">
          <FaBook className="wtpc-detail-icon wtpc-skeleton-icon" />
          <div className="wtpc-skeleton-text"></div>
        </div>
      </div>
    </div>
  </div>
);

const ActionButtonsSkeleton = () => (
  <div className="wtpc-action-buttons-container wtpc-skeleton-container">
    <div className="wtpc-action-btn wtpc-back-btn wtpc-skeleton-btn">
      <FaArrowLeft className="wtpc-skeleton-icon" />
      <span className="wtpc-btn-text wtpc-skeleton-btn-text">Back</span>
    </div>
    <div className="wtpc-action-btn wtpc-download-btn wtpc-skeleton-btn">
      <FaDownload className="wtpc-skeleton-icon" />
      <span className="wtpc-btn-text wtpc-skeleton-btn-text">Download</span>
    </div>
    <div className="wtpc-action-btn wtpc-share-btn wtpc-skeleton-btn">
      <FaShare className="wtpc-skeleton-icon" />
      <span className="wtpc-btn-text wtpc-skeleton-btn-text">Share</span>
    </div>
  </div>
);

const TopicContentSkeleton = () => (
  <div className="wtpc-topic-section wtpc-skeleton-container">
    <div className="wtpc-topic-header">
      <div className="wtpc-skeleton-topic-title"></div>
      <div className="wtpc-topic-meta">
        <div className="wtpc-meta-item wtpc-skeleton-meta">
          <FaClock className="wtpc-meta-icon wtpc-skeleton-icon" />
          <div className="wtpc-skeleton-text-small"></div>
        </div>
      </div>
    </div>
    
    <div className="wtpc-topic-content wtpc-skeleton-content-box">
      <h3 className="wtpc-skeleton-content-heading">Description</h3>
      <div className="wtpc-skeleton-content-lines">
        <div className="wtpc-skeleton-line"></div>
        <div className="wtpc-skeleton-line"></div>
        <div className="wtpc-skeleton-line wtpc-skeleton-line-short"></div>
      </div>
    </div>

    <div className="wtpc-images-section">
      <div className="wtpc-images-header">
        <h3>
          <FaImage className="wtpc-section-icon wtpc-skeleton-icon" />
          <span className="wtpc-skeleton-images-title"></span>
        </h3>
      </div>
      <div className="wtpc-images-grid">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="wtpc-image-container wtpc-skeleton-image-container">
            <div className="wtpc-image-wrapper">
              <div className="wtpc-skeleton-image"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Main Loading Skeleton (shows when wrapper is loading)
const FullPageSkeleton = () => (
  <div className="wtpc-container">
    <div className="wtpc-main-content">
      <UserProfileSkeleton />
      <ActionButtonsSkeleton />
      <TopicContentSkeleton />
    </div>
    <div className="wtpc-footer">
      <p>&copy; 2025 Work Topic Page. All rights reserved.</p>
    </div>
  </div>
);

const WorkTopicPage = ({ data, loading, error, onDownload, onShare }) => {
  const [expandedImages, setExpandedImages] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [allPages, setAllPages] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);
  const [visiblePageCount, setVisiblePageCount] = useState(10);

  const rawImages = Array.isArray(data?.topic?.images) ? data.topic.images : [];
  const validImages = rawImages.filter((img) => img && img.trim() !== "");
  const hasImages = validImages.length > 0;

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

  const downloadTopicAsPDF = () => {
    if (onDownload) {
      onDownload(data, { allPages: true });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(data);
    }
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

  useEffect(() => {
    if (validImages && validImages.length > 0) {
      setStartPage(1);
      setEndPage(validImages.length);
      setAllPages(true);
      setCustomMode(false);
      setSelectedPages([]);
      setVisiblePageCount(10);
    }
  }, [validImages.length]);

  const handleRangeDownload = (e) => {
    e.preventDefault();
    if (!onDownload) return;

    const total = validImages.length;
    const start = Math.max(1, Math.min(total, Number(startPage) || 1));
    const end = Math.max(start, Math.min(total, Number(endPage) || total));

    if (customMode) {
      const uniqueSelected = Array.from(new Set(selectedPages)).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
      if (!uniqueSelected.length) return;
      onDownload(data, {
        allPages: false,
        selectedPages: uniqueSelected,
      });
    } else {
      onDownload(data, {
        allPages,
        startPage: start,
        endPage: end,
      });
    }

    setRangeModalOpen(false);
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

  // Show skeleton if wrapper is loading
  if (loading) {
    return <FullPageSkeleton />;
  }

  if (error) {
    return (
      <div className="wtpc-error-container">
        <div className="wtpc-error-content">
          <h2>Error Loading Topic</h2>
          <p>{error}</p>
          <Link href="/works" className="wtpc-back-link">
            <FaArrowLeft /> Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wtpc-error-container">
        <div className="wtpc-error-content">
          <h2>Topic Not Found</h2>
          <p>The requested topic could not be found.</p>
          <Link href="/works" className="wtpc-back-link">
            <FaArrowLeft /> Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  const { user, subject, topic } = data;

  return (
    <div className="wtpc-container">
      {/* Main Content */}
      <div className="wtpc-main-content">
        {/* User Profile Section */}
        <div className="wtpc-user-section">
          <div className="wtpc-user-avatar">
            <img 
              src={user.profileimg} 
              alt={user.name}
              className="wtpc-profile-image"
              onError={(e) => {
                e.target.src = '/default-avatar.png'; // fallback image
              }}
            />
          </div>
          <div className="wtpc-user-info">
            <Link href={`/search/${user.usn.toLowerCase()}`} className="wtpc-user-name-link">
              <h1 className="wtpc-user-name">{user.name}</h1>
            </Link>
            <div className="wtpc-user-details">
              <div className="wtpc-detail-item">
                <FaIdCard className="wtpc-detail-icon" />
                <span>{user.usn}</span>
              </div>
              <div className="wtpc-detail-item">
                <FaBook className="wtpc-detail-icon" />
                <span>{subject.subject}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="wtpc-action-buttons-container">
          <Link href="/works" className="wtpc-action-btn wtpc-back-btn">
            <FaArrowLeft />
            <span className="wtpc-btn-text">Back</span>
          </Link>
          <button 
            onClick={downloadTopicAsPDF}
            className="wtpc-action-btn wtpc-download-btn wtpc-download-primary"
            disabled={!hasImages || !validImages.length}
            title={!hasImages || !validImages.length ? "No images available for download" : "Download as PDF"}
          >
            <FaDownload />
            <span className="wtpc-btn-text">Download</span>
          </button>
          <button
            type="button"
            onClick={openRangeModal}
            className="wtpc-action-btn wtpc-download-btn wtpc-download-caret"
            disabled={!hasImages || !validImages.length}
            title="Download selected pages"
          >
            <FaChevronDown />
          </button>
          <button 
            onClick={handleShare}
            className="wtpc-action-btn wtpc-share-btn"
            title="Share Topic"
          >
            <FaShare />
            <span className="wtpc-btn-text">Share</span>
          </button>
        </div>

        {/* Topic Content Section */}
        <div className="wtpc-topic-section">
          <div className="wtpc-topic-header">
            <h2 className="wtpc-topic-title">{topic.topic}</h2>
            <div className="wtpc-topic-meta">
              <div className="wtpc-meta-item">
                <FaClock className="wtpc-meta-icon" />
                <span>{new Date(topic.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {topic.content && (
            <div className="wtpc-topic-content">
              <h3>Description</h3>
              <p>{topic.content}</p>
            </div>
          )}

          {/* Images Section */}
          {hasImages && validImages.length > 0 && (
            <div className="wtpc-images-section">
              <div className="wtpc-images-header">
                <h3>
                  <FaImage className="wtpc-section-icon" />
                  Images ({validImages.length})
                </h3>
                <button
                  type="button"
                  onClick={togglePageNumbers}
                  className={`wtpc-page-toggle ${showPageNumbers ? "wtpc-page-toggle-active" : ""}`}
                  aria-pressed={showPageNumbers}
                  title={showPageNumbers ? "Hide page numbers" : "Show page numbers"}
                >
                  <span className="wtpc-toggle-switch" aria-hidden="true">
                    <span className="wtpc-toggle-knob" />
                  </span>
                  <FaListOl className="wtpc-toggle-icon" aria-hidden="true" />
                  <span className="wtpc-toggle-label">Page #</span>
                </button>
              </div>
              <div className="wtpc-images-grid">
                {validImages.map((imageUrl, index) => (
                  <div key={index} className="wtpc-image-container">
                    {showPageNumbers && (
                      <span className="wtpc-page-badge">{index + 1}</span>
                    )}
                    <div className="wtpc-image-wrapper">
                      {imageLoading[index] && (
                        <div className="wtpc-image-loader">
                          <div className="wtpc-loader-spinner"></div>
                          <span>Loading image...</span>
                        </div>
                      )}
                      <img 
                        src={imageUrl} 
                        alt={`${topic.topic} - Image ${index + 1}`}
                        className={`wtpc-topic-image ${expandedImages[index] ? 'wtpc-expanded' : ''} ${imageLoading[index] ? 'wtpc-loading' : ''}`}
                        onClick={() => toggleImageExpansion(index)}
                        loading="lazy"
                        onLoadStart={() => handleImageStart(index)}
                        onLoad={() => handleImageLoad(index)}
                        onError={(e) => {
                          e.target.style.display = 'none'; // Hide broken images
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasImages && (
            <div className="wtpc-no-images">
              <FaImage className="wtpc-no-images-icon" />
              <p>No images available for this topic</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="wtpc-footer">
        <p>&copy; 2025 Work Topic Page. All rights reserved.</p>
      </div>

      {rangeModalOpen && (
        <div className="wtpc-modal-overlay" role="dialog" aria-modal="true">
          <div className="wtpc-modal">
            <div className="wtpc-modal-header">
              <h3>Download pages</h3>
              <button className="wtpc-modal-close" onClick={closeRangeModal} aria-label="Close">
                ×
              </button>
            </div>
            <form className="wtpc-modal-body" onSubmit={handleRangeDownload}>
              <div className="wtpc-modal-row">
                <label className="wtpc-input-group">
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
                <label className="wtpc-input-group">
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

              <div className="wtpc-checkbox-stack">
                <label className="wtpc-checkbox">
                  <input
                    type="checkbox"
                    checked={allPages}
                    onChange={(e) => toggleAllPages(e.target.checked)}
                  />
                  <span>All pages ({validImages.length})</span>
                </label>

                <label className="wtpc-checkbox">
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
                <div className="wtpc-page-picker">
                  <div className="wtpc-page-grid">
                    {Array.from({ length: Math.min(visiblePageCount, validImages.length) }, (_, idx) => idx + 1).map((num) => (
                      <label key={num} className={`wtpc-page-chip ${selectedPages.includes(num) ? "wtpc-page-chip-active" : ""}`}>
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
                    <button type="button" className="wtpc-secondary-btn wtpc-view-more" onClick={showMorePages}>
                      View more {Math.min(10, validImages.length - visiblePageCount)}
                    </button>
                  )}
                </div>
              )}

              <div className="wtpc-modal-actions">
                <button type="button" className="wtpc-secondary-btn" onClick={closeRangeModal}>Cancel</button>
                <button type="submit" className="wtpc-primary-btn">
                  <FaDownload />
                  <span className="wtpc-btn-text">Download</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTopicPage;