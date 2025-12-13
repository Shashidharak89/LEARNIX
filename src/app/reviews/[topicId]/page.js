"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import {
  FaArrowLeft,
  FaComment,
  FaReply,
  FaTrash,
  FaPaperPlane,
  FaLightbulb,
  FaExclamationTriangle,
  FaHeart,
  FaCommentDots,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaBook,
  FaUser,
  FaEye,
  FaEllipsisV,
  FaCopy,
  FaCheck
} from "react-icons/fa";
import "./styles/ManageReviews.css";

const REVIEW_TYPES = [
  { value: "feedback", label: "Feedback", icon: FaCommentDots, color: "#0ea5e9" },
  { value: "suggestion", label: "Suggestion", icon: FaLightbulb, color: "#f59e0b" },
  { value: "mistake", label: "Mistake", icon: FaExclamationTriangle, color: "#ef4444" },
  { value: "appreciation", label: "Appreciation", icon: FaHeart, color: "#10b981" }
];

const getTypeInfo = (type) => {
  return REVIEW_TYPES.find(t => t.value === type) || REVIEW_TYPES[0];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, itemType = "review" }) => {
  if (!isOpen) return null;
  
  return (
    <div className="mr-modal-overlay" onClick={onCancel}>
      <div className="mr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mr-modal-icon">
          <FaTrash />
        </div>
        <h4>Delete {itemType}?</h4>
        <p>Are you sure you want to delete this {itemType}? This action cannot be undone.</p>
        <div className="mr-modal-actions">
          <button className="mr-modal-cancel" onClick={onCancel}>No, Cancel</button>
          <button className="mr-modal-confirm" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
};

// Three Dot Menu Component
const ThreeDotMenu = ({ message, onDelete, canDelete, isRead, onMarkAsRead, showMarkAsRead = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDeleteClick = () => {
    setIsOpen(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  const handleMarkAsReadClick = () => {
    setIsOpen(false);
    if (onMarkAsRead) onMarkAsRead();
  };

  return (
    <>
      <div className="mr-three-dot-menu" ref={menuRef}>
        <button 
          className="mr-three-dot-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="More options"
        >
          <FaEllipsisV />
        </button>
        
        {isOpen && (
          <div className="mr-menu-dropdown">
            <button className="mr-menu-item" onClick={handleCopy}>
              {copied ? <FaCheck className="mr-menu-icon" /> : <FaCopy className="mr-menu-icon" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            {showMarkAsRead && !isRead && (
              <button className="mr-menu-item mr-menu-mark-read" onClick={handleMarkAsReadClick}>
                <FaCheck className="mr-menu-icon" />
                <span>Mark as Read</span>
              </button>
            )}
            {canDelete && (
              <button className="mr-menu-item mr-menu-delete" onClick={handleDeleteClick}>
                <FaTrash className="mr-menu-icon" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

// Review Card Component
const ReviewCard = ({
  review,
  currentUserId,
  onReply,
  onDeleteReply,
  onMarkAsRead,
  replyingTo,
  setReplyingTo
}) => {
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const [submittingReply, setSubmittingReply] = useState(false);
  const typeInfo = getTypeInfo(review.type);
  const TypeIcon = typeInfo.icon;

  const handleReplySubmit = async () => {
    if (replyText.trim()) {
      setSubmittingReply(true);
      await onReply(review._id, replyText.trim());
      setReplyText("");
      setReplyingTo(null);
      setSubmittingReply(false);
    }
  };

  return (
    <div className={`mr-review-card ${!review.isRead ? 'mr-unread' : ''}`}>
      <div className="mr-review-header">
        <div className="mr-reviewer-info">
          <img
            src={review.reviewerId?.profileimg || 'https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp'}
            alt={review.reviewerId?.name || 'User'}
            className="mr-reviewer-avatar"
            onError={(e) => {
              e.target.src = 'https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp';
            }}
          />
          <div className="mr-reviewer-details">
            <Link href={`/search/${review.reviewerId?.usn?.toLowerCase() || ''}`} className="mr-reviewer-name">
              {review.reviewerId?.name || 'Unknown User'}
            </Link>
            <div className="mr-review-meta">
              <span className="mr-review-time">{formatDate(review.timestamp)}</span>
              <span
                className="mr-review-type-badge"
                style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}
              >
                <TypeIcon className="mr-type-icon" />
                {typeInfo.label}
              </span>
              {!review.isRead && (
                <span className="mr-new-badge">New</span>
              )}
            </div>
          </div>
        </div>
        {/* Three dot menu for review - Copy and Mark as Read */}
        <ThreeDotMenu 
          message={review.message}
          onDelete={() => {}}
          canDelete={false}
          isRead={review.isRead}
          onMarkAsRead={() => onMarkAsRead(review._id)}
          showMarkAsRead={true}
        />
      </div>

      <div className="mr-review-content">
        <p>{review.message}</p>
      </div>

      {/* Replies Section */}
      {review.replies && review.replies.length > 0 && (
        <div className="mr-replies-section">
          <button
            className="mr-toggle-replies"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <FaChevronUp /> : <FaChevronDown />}
            {review.replies.length} {review.replies.length === 1 ? 'Reply' : 'Replies'}
          </button>

          {showReplies && (
            <div className="mr-replies-list">
              {review.replies.map((reply, index) => {
                const canDeleteReply = reply.userId?._id === currentUserId;
                return (
                  <div key={index} className="mr-reply-card">
                    <div className="mr-reply-header">
                      <img
                        src={reply.userId?.profileimg || 'https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp'}
                        alt={reply.userId?.name || 'User'}
                        className="mr-reply-avatar"
                        onError={(e) => {
                          e.target.src = 'https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp';
                        }}
                      />
                      <div className="mr-reply-info">
                        <span className="mr-reply-name">
                          {reply.userId?.name || 'Unknown'}
                          {reply.userId?._id === currentUserId && (
                            <span className="mr-you-badge">You</span>
                          )}
                        </span>
                        <span className="mr-reply-time">{formatDate(reply.timestamp)}</span>
                      </div>
                      <ThreeDotMenu 
                        message={reply.message}
                        onDelete={() => onDeleteReply(review._id, index)}
                        canDelete={canDeleteReply}
                      />
                    </div>
                    <p className="mr-reply-content">{reply.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reply Input */}
      <div className="mr-reply-section">
        {replyingTo === review._id ? (
          <div className="mr-reply-input-container">
            <textarea
              className="mr-reply-input"
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
            />
            <div className="mr-reply-actions">
              <button
                className="mr-cancel-btn"
                onClick={() => {
                  setReplyText("");
                  setReplyingTo(null);
                }}
              >
                <FaTimes /> Cancel
              </button>
              <button
                className="mr-send-btn"
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || submittingReply}
              >
                <FaPaperPlane /> {submittingReply ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mr-reply-trigger"
            onClick={() => setReplyingTo(review._id)}
          >
            <FaReply /> Reply to this review
          </button>
        )}
      </div>
    </div>
  );
};

// Main Page Component
const ManageReviewsPage = () => {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.topicId;

  const [reviews, setReviews] = useState([]);
  const [topicData, setTopicData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [filterType, setFilterType] = useState("all");

  // Check authorization and fetch data
  useEffect(() => {
    const initPage = async () => {
      try {
        const usn = localStorage.getItem("usn");
        if (!usn) {
          setError("Please login to access this page.");
          setLoading(false);
          return;
        }

        // Fetch current user
        const userRes = await fetch(`/api/user?usn=${usn}`);
        if (!userRes.ok) {
          setError("Failed to fetch user data.");
          setLoading(false);
          return;
        }
        const userData = await userRes.json();
        const userId = userData.user.id;
        setCurrentUserId(userId);

        // Fetch topic data to verify ownership
        const topicRes = await fetch(`/api/work/getbytopicid/${topicId}`);
        if (!topicRes.ok) {
          setError("Topic not found.");
          setLoading(false);
          return;
        }
        const topicInfo = await topicRes.json();
        setTopicData(topicInfo);

        // Check if user is the uploader
        if (topicInfo.user._id.toString() !== userId.toString()) {
          setError("You are not authorized to view this page. Only the topic uploader can manage reviews.");
          setLoading(false);
          return;
        }

        setIsAuthorized(true);

        // Fetch reviews for this topic (as uploader, we get all reviews)
        const reviewsRes = await fetch(`/api/review/topic/${topicId}?userId=${userId}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing page:", err);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    };

    if (topicId) {
      initPage();
    }
  }, [topicId]);

  // Reply to a review
  const handleReply = async (reviewId, message) => {
    if (!currentUserId) return;

    try {
      const res = await fetch(`/api/review/${reviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          message
        })
      });

      const data = await res.json();

      if (res.ok) {
        setReviews(reviews.map(r =>
          r._id === reviewId ? data.review : r
        ));
      } else {
        alert(data.error || "Failed to add reply");
      }
    } catch (err) {
      alert("Failed to add reply");
      console.error("Error adding reply:", err);
    }
  };

  // Delete a reply
  const handleDeleteReply = async (reviewId, replyIndex) => {
    try {
      const res = await fetch(`/api/review/${reviewId}/reply`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          replyIndex
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(reviews.map(r => 
          r._id === reviewId ? data.review : r
        ));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete reply");
      }
    } catch (err) {
      alert("Failed to delete reply");
      console.error("Error deleting reply:", err);
    }
  };

  // Mark a review as read
  const handleMarkAsRead = async (reviewId) => {
    try {
      const res = await fetch(`/api/review/${reviewId}/read`, {
        method: "PATCH"
      });

      if (res.ok) {
        // Update local state - mark this review as read
        setReviews(reviews.map(r => 
          r._id === reviewId ? { ...r, isRead: true } : r
        ));
      }
    } catch (err) {
      console.error("Error marking review as read:", err);
    }
  };

  // Filter reviews
  const filteredReviews = filterType === "all"
    ? reviews
    : reviews.filter(r => r.type === filterType);

  const unreadCount = reviews.filter(r => !r.isRead).length;

  // Loading state
  if (loading) {
    return (
      <div className="mr-page-wrapper">
        <Navbar />
        <div className="mr-container">
          <div className="mr-loading">
            <div className="mr-loader"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mr-page-wrapper">
        <Navbar />
        <div className="mr-container">
          <div className="mr-error-container">
            <div className="mr-error-content">
              <FaExclamationTriangle className="mr-error-icon" />
              <h2>Access Denied</h2>
              <p>{error}</p>
              <Link href="/upload" className="mr-back-link">
                <FaArrowLeft /> Back to Upload
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-page-wrapper">
      <Navbar />
      <div className="mr-container">
        {/* Header Section */}
        <div className="mr-header-section">
          <Link href="/upload" className="mr-back-btn">
            <FaArrowLeft /> Back to Upload
          </Link>

          <div className="mr-topic-info">
            <h1 className="mr-page-title">
              <FaComment className="mr-title-icon" />
              Manage Reviews
            </h1>
            {topicData && (
              <div className="mr-topic-details">
                <div className="mr-detail-item">
                  <FaBook className="mr-detail-icon" />
                  <span>{topicData.subject?.subject}</span>
                </div>
                <div className="mr-detail-item">
                  <FaCommentDots className="mr-detail-icon" />
                  <span>{topicData.topic?.topic}</span>
                </div>
                <Link href={`/works/${topicId}`} className="mr-view-topic-btn">
                  <FaEye /> View Topic
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mr-stats">
            <div className="mr-stat-item">
              <span className="mr-stat-value">{reviews.length}</span>
              <span className="mr-stat-label">Total Reviews</span>
            </div>
            <div className="mr-stat-item mr-stat-unread">
              <span className="mr-stat-value">{unreadCount}</span>
              <span className="mr-stat-label">Unread</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mr-filter-section">
          <span className="mr-filter-label">Filter by type:</span>
          <div className="mr-filter-buttons">
            <button
              className={`mr-filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            {REVIEW_TYPES.map(type => {
              const Icon = type.icon;
              const count = reviews.filter(r => r.type === type.value).length;
              return (
                <button
                  key={type.value}
                  className={`mr-filter-btn ${filterType === type.value ? 'active' : ''}`}
                  onClick={() => setFilterType(type.value)}
                  style={{
                    '--filter-color': type.color
                  }}
                >
                  <Icon /> {type.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="mr-reviews-section">
          {filteredReviews.length === 0 ? (
            <div className="mr-no-reviews">
              <FaCommentDots className="mr-empty-icon" />
              <h3>No Feedback Received</h3>
              <p>
                {filterType === 'all'
                  ? "You haven't received any private feedback for this topic yet."
                  : `No ${filterType} feedback found.`}
              </p>
            </div>
          ) : (
            <div className="mr-reviews-list">
              {filteredReviews.map(review => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onDeleteReply={handleDeleteReply}
                  onMarkAsRead={handleMarkAsRead}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageReviewsPage;
