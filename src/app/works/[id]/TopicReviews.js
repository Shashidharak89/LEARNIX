"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
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
  FaChevronUp
} from "react-icons/fa";
import "./styles/TopicReviews.css";

const REVIEW_TYPES = [
  { value: "feedback", label: "Feedback", icon: FaCommentDots, color: "#3b82f6" },
  { value: "suggestion", label: "Suggestion", icon: FaLightbulb, color: "#f59e0b" },
  { value: "mistake", label: "Report Mistake", icon: FaExclamationTriangle, color: "#ef4444" },
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

// Single Review Card Component
const ReviewCard = ({ 
  review, 
  currentUserId, 
  isUploader, 
  uploaderId,
  onReply, 
  onDelete,
  isReplying,
  setReplyingTo,
  isLoggedIn
}) => {
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const typeInfo = getTypeInfo(review.type);
  const TypeIcon = typeInfo.icon;

  const canReply = isLoggedIn && currentUserId && (isUploader || review.reviewerId._id === currentUserId);
  const canDelete = isLoggedIn && currentUserId && review.reviewerId._id === currentUserId;

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(review._id, replyText.trim());
      setReplyText("");
      setReplyingTo(null);
    }
  };

  return (
    <div className="tr-review-card">
      <div className="tr-review-header">
        <div className="tr-reviewer-info">
          <img 
            src={review.reviewerId.profileimg} 
            alt={review.reviewerId.name}
            className="tr-reviewer-avatar"
            onError={(e) => {
              e.target.src = 'https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp';
            }}
          />
          <div className="tr-reviewer-details">
            <Link href={`/search/${review.reviewerId.usn.toLowerCase()}`} className="tr-reviewer-name">
              {review.reviewerId.name}
            </Link>
            <span className="tr-review-meta">
              <span className="tr-review-time">{formatDate(review.timestamp)}</span>
              <span 
                className="tr-review-type-badge"
                style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}
              >
                <TypeIcon className="tr-type-icon" />
                {typeInfo.label}
              </span>
            </span>
          </div>
        </div>
        {canDelete && (
          <button 
            className="tr-delete-btn"
            onClick={() => onDelete(review._id)}
            title="Delete review"
          >
            <FaTrash />
          </button>
        )}
      </div>

      <div className="tr-review-content">
        <p>{review.message}</p>
      </div>

      {/* Replies Section */}
      {review.replies && review.replies.length > 0 && (
        <div className="tr-replies-section">
          <button 
            className="tr-toggle-replies"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <FaChevronUp /> : <FaChevronDown />}
            {review.replies.length} {review.replies.length === 1 ? 'Reply' : 'Replies'}
          </button>
          
          {showReplies && (
            <div className="tr-replies-list">
              {review.replies.map((reply, index) => (
                <div key={index} className="tr-reply-card">
                  <div className="tr-reply-header">
                    <img 
                      src={reply.userId.profileimg} 
                      alt={reply.userId.name}
                      className="tr-reply-avatar"
                      onError={(e) => {
                        e.target.src = 'https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp';
                      }}
                    />
                    <div className="tr-reply-info">
                      <span className="tr-reply-name">
                        {reply.userId.name}
                        {reply.userId._id === uploaderId && (
                          <span className="tr-uploader-badge">Uploader</span>
                        )}
                      </span>
                      <span className="tr-reply-time">{formatDate(reply.timestamp)}</span>
                    </div>
                  </div>
                  <p className="tr-reply-content">{reply.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply Input */}
      {canReply && (
        <div className="tr-reply-section">
          {isReplying ? (
            <div className="tr-reply-input-container">
              <textarea
                className="tr-reply-input"
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
              />
              <div className="tr-reply-actions">
                <button 
                  className="tr-cancel-btn"
                  onClick={() => {
                    setReplyText("");
                    setReplyingTo(null);
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button 
                  className="tr-send-btn"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  <FaPaperPlane /> Send
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="tr-reply-trigger"
              onClick={() => setReplyingTo(review._id)}
            >
              <FaReply /> Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Main TopicReviews Component
const TopicReviews = ({ topicId }) => {
  const [reviews, setReviews] = useState([]);
  const [isUploader, setIsUploader] = useState(false);
  const [uploaderId, setUploaderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User state - fetched from localStorage USN
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  
  // New review form state
  const [showNewReview, setShowNewReview] = useState(false);
  const [newReviewType, setNewReviewType] = useState("feedback");
  const [newReviewMessage, setNewReviewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch current user from localStorage USN
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const usn = localStorage.getItem("usn");
        if (usn) {
          setIsLoggedIn(true);
          const res = await fetch(`/api/user?usn=${usn}`);
          if (res.ok) {
            const userData = await res.json();
            setCurrentUserId(userData._id);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      } finally {
        setUserLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch reviews
  const fetchReviews = async () => {
    if (!topicId) return;
    
    try {
      setLoading(true);
      const url = currentUserId 
        ? `/api/review/topic/${topicId}?userId=${currentUserId}`
        : `/api/review/topic/${topicId}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setReviews(data.reviews || []);
        setIsUploader(data.isUploader || false);
        setUploaderId(data.uploaderId || null);
      } else {
        setError(data.error || "Failed to fetch reviews");
      }
    } catch (err) {
      setError("Failed to load reviews");
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews when topicId or currentUserId changes (after user is loaded)
  useEffect(() => {
    if (!userLoading) {
      fetchReviews();
    }
  }, [topicId, currentUserId, userLoading]);

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewMessage.trim() || !currentUserId || !isLoggedIn) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          reviewerId: currentUserId,
          type: newReviewType,
          message: newReviewMessage.trim()
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setReviews([data.review, ...reviews]);
        setNewReviewMessage("");
        setNewReviewType("feedback");
        setShowNewReview(false);
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch (err) {
      alert("Failed to submit review");
      console.error("Error submitting review:", err);
    } finally {
      setSubmitting(false);
    }
  };

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

  // Delete a review
  const handleDelete = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const res = await fetch(`/api/review/${reviewId}?userId=${currentUserId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setReviews(reviews.filter(r => r._id !== reviewId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete review");
      }
    } catch (err) {
      alert("Failed to delete review");
      console.error("Error deleting review:", err);
    }
  };

  // Show loading while fetching user
  if (userLoading) {
    return (
      <div className="tr-container">
        <div className="tr-loading">
          <div className="tr-loader"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show login prompt only if USN is not in localStorage
  if (!isLoggedIn) {
    return (
      <div className="tr-container">
        <div className="tr-login-prompt">
          <FaComment className="tr-login-icon" />
          <p>Please <Link href="/login" className="tr-login-link">login</Link> to view and add reviews.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tr-container">
      <div className="tr-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="tr-title">
          <FaComment className="tr-title-icon" />
          Reviews & Feedback
          {reviews.length > 0 && (
            <span className="tr-count-badge">{reviews.length}</span>
          )}
        </h3>
        <button className="tr-expand-btn">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      {isExpanded && (
        <div className="tr-content">
          {/* Add Review Button */}
          {!isUploader && !showNewReview && (
            <button 
              className="tr-add-review-btn"
              onClick={() => setShowNewReview(true)}
            >
              <FaComment /> Add Review
            </button>
          )}

          {/* New Review Form */}
          {showNewReview && !isUploader && (
            <form className="tr-new-review-form" onSubmit={handleSubmitReview}>
              <div className="tr-form-header">
                <h4>Add Your Review</h4>
                <button 
                  type="button" 
                  className="tr-close-form"
                  onClick={() => setShowNewReview(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="tr-type-selector">
                {REVIEW_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`tr-type-btn ${newReviewType === type.value ? 'tr-type-active' : ''}`}
                      style={{ 
                        '--type-color': type.color,
                        borderColor: newReviewType === type.value ? type.color : 'transparent',
                        backgroundColor: newReviewType === type.value ? `${type.color}15` : 'transparent'
                      }}
                      onClick={() => setNewReviewType(type.value)}
                    >
                      <Icon style={{ color: type.color }} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                className="tr-message-input"
                placeholder="Share your feedback, suggestions, or report any mistakes..."
                value={newReviewMessage}
                onChange={(e) => setNewReviewMessage(e.target.value)}
                rows={4}
                required
              />

              <div className="tr-form-actions">
                <button 
                  type="button" 
                  className="tr-cancel-btn"
                  onClick={() => {
                    setShowNewReview(false);
                    setNewReviewMessage("");
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="tr-submit-btn"
                  disabled={submitting || !newReviewMessage.trim()}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          )}

          {/* Uploader Info */}
          {isUploader && (
            <div className="tr-uploader-info">
              <p>You are viewing reviews for your topic. You can reply to any review below.</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="tr-loading">
              <div className="tr-loader"></div>
              <span>Loading reviews...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="tr-error">
              <p>{error}</p>
              <button onClick={fetchReviews}>Retry</button>
            </div>
          )}

          {/* Reviews List */}
          {!loading && !error && (
            <div className="tr-reviews-list">
              {reviews.length === 0 ? (
                <div className="tr-no-reviews">
                  <FaCommentDots className="tr-empty-icon" />
                  <p>
                    {isUploader 
                      ? "No reviews yet for this topic." 
                      : "Be the first to add a review!"}
                  </p>
                </div>
              ) : (
                reviews.map(review => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    currentUserId={currentUserId}
                    isUploader={isUploader}
                    uploaderId={uploaderId}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    isReplying={replyingTo === review._id}
                    setReplyingTo={setReplyingTo}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicReviews;
