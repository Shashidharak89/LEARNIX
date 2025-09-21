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

const WorkTopicPage = ({ data, loading, error, onDownload, onShare }) => {
  const [expandedImages, setExpandedImages] = useState({});

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

  if (loading) {
    return (
      <div className="wtp-loading-container">
        <div className="wtp-loading-spinner"></div>
        <p className="wtp-loading-text">Loading topic details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wtp-error-container">
        <div className="wtp-error-content">
          <h2>Error Loading Topic</h2>
          <p>{error}</p>
          <Link href="/works" className="wtp-back-link">
            <FaArrowLeft /> Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wtp-error-container">
        <div className="wtp-error-content">
          <h2>Topic Not Found</h2>
          <p>The requested topic could not be found.</p>
          <Link href="/works" className="wtp-back-link">
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
    <div className="wtp-container">
      {/* Navigation Header */}
      <div className="wtp-nav-header">
        <Link href="/works" className="wtp-back-button">
          <FaArrowLeft />
          <span>Back to Topics</span>
        </Link>
        <div className="wtp-action-buttons">
          <button 
            onClick={downloadTopicAsPDF}
            className="wtp-action-btn wtp-download-btn"
            disabled={!hasImages}
            title="Download as PDF"
          >
            <FaDownload />
            <span>Download</span>
          </button>
          <button 
            onClick={handleShare}
            className="wtp-action-btn wtp-share-btn"
            title="Share Topic"
          >
            <FaShare />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="wtp-main-content">
        {/* User Profile Section */}
        <div className="wtp-user-section">
          <div className="wtp-user-avatar">
            <img 
              src={user.profileimg} 
              alt={user.name}
              className="wtp-profile-image"
            />
          </div>
          <div className="wtp-user-info">
            <Link href={`/search/${user.usn.toLowerCase()}`} className="wtp-user-name-link">
              <h1 className="wtp-user-name">{user.name}</h1>
            </Link>
            <div className="wtp-user-details">
              <div className="wtp-detail-item">
                <FaIdCard className="wtp-detail-icon" />
                <span>{user.usn}</span>
              </div>
              <div className="wtp-detail-item">
                <FaBook className="wtp-detail-icon" />
                <span>{subject.subject}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Content Section */}
        <div className="wtp-topic-section">
          <div className="wtp-topic-header">
            <h2 className="wtp-topic-title">{topic.topic}</h2>
            <div className="wtp-topic-meta">
              <div className="wtp-meta-item">
                <FaClock className="wtp-meta-icon" />
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
            <div className="wtp-topic-content">
              <h3>Description</h3>
              <p>{topic.content}</p>
            </div>
          )}

          {/* Images Section */}
          {hasImages && validImages.length > 0 && (
            <div className="wtp-images-section">
              <div className="wtp-images-header">
                <h3>
                  <FaImage className="wtp-section-icon" />
                  Images ({validImages.length})
                </h3>
              </div>
              <div className="wtp-images-grid">
                {validImages.map((imageUrl, index) => (
                  <div key={index} className="wtp-image-container">
                    <div className="wtp-image-wrapper">
                      <img 
                        src={imageUrl} 
                        alt={`${topic.topic} - Image ${index + 1}`}
                        className={`wtp-topic-image ${expandedImages[index] ? 'wtp-expanded' : ''}`}
                        onClick={() => toggleImageExpansion(index)}
                        loading="lazy"
                      />
                      <div className="wtp-image-overlay">
                        <span>Click to {expandedImages[index] ? 'minimize' : 'expand'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasImages && (
            <div className="wtp-no-images">
              <FaImage className="wtp-no-images-icon" />
              <p>No images available for this topic</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="wtp-footer">
        <p>&copy; 2025 Work Topic Page. All rights reserved.</p>
      </div>
    </div>
  );
};

export default WorkTopicPage;