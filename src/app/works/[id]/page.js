"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

const WorkTopicPage = () => {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedImages, setExpandedImages] = useState({});

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/work/getbytopicid/${id}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleImageExpansion = (imageIndex) => {
    setExpandedImages(prev => ({
      ...prev,
      [imageIndex]: !prev[imageIndex]
    }));
  };

  const downloadTopicAsPDF = async () => {
    if (!data?.topic?.images || data.topic.images.length === 0) {
      alert('No images available for this topic');
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Add title and metadata
      pdf.setFontSize(20);
      pdf.text(`${data.topic.topic}`, margin, 30);
      pdf.setFontSize(12);
      pdf.text(`Subject: ${data.subject.subject}`, margin, 50);
      pdf.text(`Student: ${data.user.name} (${data.user.usn})`, margin, 65);
      pdf.text(`Date: ${new Date(data.topic.timestamp).toLocaleDateString()}`, margin, 80);

      // Add content if available
      if (data.topic.content) {
        pdf.text(`Content: ${data.topic.content}`, margin, 95);
      }

      // Process images
      const imagePromises = data.topic.images
        .filter(url => url && url.trim() !== '')
        .map((imageUrl, imgIndex) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ img, imgIndex });
            img.onerror = () => reject(`Failed to load image ${imgIndex + 1}`);
            img.src = imageUrl;
          });
        });

      const loadedImages = await Promise.all(imagePromises);

      for (let i = 0; i < loadedImages.length; i++) {
        const { img } = loadedImages[i];
        if (i > 0) pdf.addPage();

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const ratio = Math.min((pageWidth - 2 * margin) / imgWidth, (pageHeight - 2 * margin) / imgHeight);

        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        pdf.addImage(img, 'JPEG', x, y, width, height);
      }

      const fileName = `${data.topic.topic}_${data.subject.subject}_${data.user.name}.pdf`.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const title = `${data.topic.topic} - ${data.subject.subject}`;
    
    if (navigator.share) {
      navigator.share({ 
        title: title,
        text: `Check out this topic by ${data.user.name}`,
        url: url 
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
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
            <h1 className="wtp-user-name">{user.name}</h1>
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