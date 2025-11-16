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
  FaIdCard
} from "react-icons/fa";
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
      onDownload(data);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(data);
    }
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
  const hasImages = topic.images && topic.images.length > 0;
  const validImages = hasImages ? topic.images.filter(img => img && img.trim() !== '') : [];

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
            className="wtpc-action-btn wtpc-download-btn"
            disabled={!hasImages || !validImages.length}
            title={!hasImages || !validImages.length ? "No images available for download" : "Download as PDF"}
          >
            <FaDownload />
            <span className="wtpc-btn-text">Download</span>
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
              </div>
              <div className="wtpc-images-grid">
                {validImages.map((imageUrl, index) => (
                  <div key={index} className="wtpc-image-container">
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
    </div>
  );
};

export default WorkTopicPage;