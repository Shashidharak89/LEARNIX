"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FaBook,
  FaArrowLeft,
  FaShare,
  FaIdCard,
  FaImage,
  FaClock,
  FaLock,
} from "react-icons/fa";
import "./styles/WorkSubjectPage.css";

const WorkSubjectPage = ({ data, loading, error, onShare }) => {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (topicId) => {
    setImageErrors((prev) => ({ ...prev, [topicId]: true }));
  };

  const handleShare = () => {
    if (onShare) onShare(data);
  };

  if (loading) {
    return (
      <div className="wsp-container">
        <div className="wsp-main-content">
          <div className="wsp-skeleton-block" />
          <div className="wsp-skeleton-block" />
          <div className="wsp-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="wsp-skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wsp-error-container">
        <div className="wsp-error-content">
          <h2>Error Loading Subject</h2>
          <p>{error}</p>
          <Link href="/works" className="wsp-back-link">
            <FaArrowLeft /> Back to Works
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wsp-error-container">
        <div className="wsp-error-content">
          <h2>Subject Not Found</h2>
          <p>The requested subject could not be found.</p>
          <Link href="/works" className="wsp-back-link">
            <FaArrowLeft /> Back to Works
          </Link>
        </div>
      </div>
    );
  }

  const { user, subject, topics } = data;
  const hasTopics = Array.isArray(topics) && topics.length > 0;

  return (
    <div className="wsp-container">
      <div className="wsp-main-content">
        <div className="wsp-user-section">
          <div className="wsp-user-avatar">
            <img
              src={user.profileimg}
              alt={user.name}
              className="wsp-profile-image"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>
          <div className="wsp-user-info">
            <Link href={`/search/${user.usn.toLowerCase()}`} className="wsp-user-name-link">
              <h1 className="wsp-user-name">{user.name}</h1>
            </Link>
            <div className="wsp-user-details">
              <div className="wsp-detail-item">
                <FaIdCard className="wsp-detail-icon" />
                <span>{user.usn}</span>
              </div>
              <div className="wsp-detail-item">
                <FaBook className="wsp-detail-icon" />
                <span>{subject.subject}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wsp-action-buttons-container">
          <Link href="/works" className="wsp-action-btn wsp-back-btn">
            <FaArrowLeft />
            <span className="wsp-btn-text">Back</span>
          </Link>
          <button onClick={handleShare} className="wsp-action-btn wsp-share-btn" title="Share Subject">
            <FaShare />
            <span className="wsp-btn-text">Share</span>
          </button>
        </div>

        <div className="wsp-subject-info">
          <div className="wsp-subject-header">
            <h2 className="wsp-subject-title">{subject.subject}</h2>
            {!subject.public && (
              <span className="wsp-subject-private-badge">
                <FaLock className="wsp-badge-icon" />
                Private
              </span>
            )}
          </div>
          <p className="wsp-subject-description">
            {subject.public
              ? "This is a public subject. You can view all public topics below."
              : "This is a private subject. Only the uploader can see this subject."}
          </p>
        </div>

        {hasTopics ? (
          <div className="wsp-topics-section">
            <div className="wsp-topics-header">
              <h3>
                <FaBook className="wsp-section-icon" /> Topics ({topics.length})
              </h3>
            </div>
            <div className="wsp-topics-grid">
              {topics.map((topic) => (
                <Link key={topic._id} href={`/works/${topic._id}`} className="wsp-topic-card-link">
                  <div className="wsp-topic-card">
                    {Array.isArray(topic.images) && topic.images.length > 0 && !imageErrors[topic._id] ? (
                      <div className="wsp-card-image">
                        <img
                          src={topic.images[0]}
                          alt={topic.topic}
                          className="wsp-card-img"
                          onError={() => handleImageError(topic._id)}
                        />
                        <span className="wsp-image-count">
                          <FaImage /> {topic.images.length}
                        </span>
                      </div>
                    ) : (
                      <div className="wsp-card-image wsp-card-no-image">
                        <FaBook className="wsp-no-image-icon" />
                      </div>
                    )}

                    <div className="wsp-card-content">
                      <h4 className="wsp-card-title">{topic.topic}</h4>
                      <div className="wsp-card-meta">
                        <div className="wsp-meta-item">
                          <FaClock className="wsp-meta-icon" />
                          <span>
                            {new Date(topic.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      {topic.content && <p className="wsp-card-description">{topic.content.substring(0, 80)}...</p>}
                    </div>

                    <div className="wsp-card-overlay">
                      <span className="wsp-card-view-btn">View Topic</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="wsp-empty-state">
            <FaBook className="wsp-empty-icon" />
            <h3>No Topics Yet</h3>
            <p>This subject doesn't have any public topics yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkSubjectPage;
