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

// Lazy Loading Image Component
const LazyImage = ({ src, alt, className, onClick, index }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div ref={imgRef} className="wtp-lazy-image-container">
      {!isInView && (
        <div className="wtp-image-skeleton">
          <div className="wtp-skeleton-content">
            <FaImage className="wtp-skeleton-icon" />
            <span>Loading image...</span>
          </div>
        </div>
      )}
      {isInView && !hasError && (
        <>
          {!isLoaded && (
            <div className="wtp-image-skeleton">
              <div className="wtp-skeleton-content">
                <div className="wtp-loading-spinner-small"></div>
                <span>Loading...</span>
              </div>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`${className} ${isLoaded ? 'wtp-image-loaded' : 'wtp-image-loading'}`}
            onClick={onClick}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            style={{
              display: isLoaded ? 'block' : 'none'
            }}
          />
        </>
      )}
      {hasError && (
        <div className="wtp-image-error">
          <FaImage className="wtp-error-icon" />
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

const WorkTopicPage = ({ data, loading, error, onDownload, onShare }) => {
  const [expandedImages, setExpandedImages] = useState({});
  const [visibleImages, setVisibleImages] = useState(6); // Initial load count
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  // Intersection observer for loading more images
  useEffect(() => {
    if (!data?.topic?.images) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleImages < data.topic.images.length) {
          loadMoreImages();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleImages, data?.topic?.images]);

  const loadMoreImages = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleImages(prev => Math.min(prev + 6, data?.topic?.images?.length || 0));
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, data?.topic?.images?.length]);

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
                {validImages.slice(0, visibleImages).map((imageUrl, index) => (
                  <div key={index} className="wtp-image-container">
                    <div className="wtp-image-wrapper">
                      <LazyImage
                        src={imageUrl}
                        alt={`${topic.topic} - Image ${index + 1}`}
                        className={`wtp-topic-image ${expandedImages[index] ? 'wtp-expanded' : ''}`}
                        onClick={() => toggleImageExpansion(index)}
                        index={index}
                      />
                      <div className="wtp-image-overlay">
                        <span>Click to {expandedImages[index] ? 'minimize' : 'expand'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Images Trigger */}
              {visibleImages < validImages.length && (
                <div ref={loadMoreRef} className="wtp-load-more-images">
                  {isLoadingMore ? (
                    <div className="wtp-loading-more-images">
                      <div className="wtp-loading-spinner-small"></div>
                      <span>Loading more images...</span>
                    </div>
                  ) : (
                    <button 
                      onClick={loadMoreImages}
                      className="wtp-load-more-btn"
                    >
                      Load More Images ({validImages.length - visibleImages} remaining)
                    </button>
                  )}
                </div>
              )}
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