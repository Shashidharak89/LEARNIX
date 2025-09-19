"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import "./styles/Feedback.css";

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbacksLoading, setFeedbacksLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef();

  // Fetch feedbacks with pagination
  const fetchFeedbacks = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setFeedbacksLoading(true);
      if (pageNum > 1) setLoadingMore(true);
      
      const res = await fetch(`/api/feedback?page=${pageNum}&limit=${pageNum === 1 ? 8 : 10}`);
      const data = await res.json();
      
      if (reset || pageNum === 1) {
        setFeedbacks(data.feedbacks || data);
      } else {
        setFeedbacks(prev => [...prev, ...(data.feedbacks || data)]);
      }
      
      // Check if there are more feedbacks to load
      if (data.feedbacks) {
        setHasMore(data.hasMore || data.feedbacks.length === (pageNum === 1 ? 8 : 10));
      } else {
        setHasMore(data.length === (pageNum === 1 ? 8 : 10));
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    } finally {
      setFeedbacksLoading(false);
      setLoadingMore(false);
    }
  };

  // Intersection Observer for infinite scroll
  const lastFeedbackElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore]);

  // Load more feedbacks when page changes
  useEffect(() => {
    if (page > 1) {
      fetchFeedbacks(page, false);
    }
  }, [page]);

  // Proper time formatter
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: newFeedback.trim() }),
      });
      
      if (response.ok) {
        setNewFeedback("");
        setPage(1);
        fetchFeedbacks(1, true);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(1, true);
  }, []);

  return (
    <div className="lx-feedback-container">
      <div className="lx-feedback-content">
        {/* Header Section */}
        <div className="lx-feedback-header">
          <h1 className="lx-feedback-title">Share Your Feedback</h1>
          <p className="lx-feedback-subtitle">
            Help us improve Learnix for all students
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="lx-privacy-notice">
          <div className="lx-privacy-icon">🔒</div>
          <p>We don't collect your name or any personal details. Your feedback is completely anonymous.</p>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="lx-feedback-form">
          <div className="lx-input-group">
            <textarea
              placeholder="Share your thoughts... (e.g., Rate our website, suggest improvements, report issues, or tell us what you love about Learnix)"
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="lx-feedback-textarea"
              rows={4}
              maxLength={500}
            />
            <div className="lx-char-counter">
              {newFeedback.length}/500
            </div>
          </div>
          <button 
            type="submit" 
            className={`lx-submit-btn ${loading ? 'loading' : ''}`} 
            disabled={loading || !newFeedback.trim()}
          >
            {loading ? (
              <>
                <div className="lx-spinner"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </form>

        {/* Feedback Suggestions */}
        <div className="lx-feedback-suggestions">
          <h3>What kind of feedback can you share?</h3>
          <div className="lx-suggestion-tags">
            <span className="lx-tag">🌟 Rate our website</span>
            <span className="lx-tag">💡 Suggest improvements</span>
            <span className="lx-tag">🐛 Report bugs or issues</span>
            <span className="lx-tag">❤️ Share what you love</span>
            <span className="lx-tag">📚 Request new features</span>
          </div>
        </div>

        {/* Recent Feedbacks Section */}
        <div className="lx-recent-feedbacks">
          <h2 className="lx-section-title">Recent Feedbacks</h2>
          
          {feedbacksLoading ? (
            <div className="lx-feedbacks-loading">
              <div className="lx-preloader">
                <div className="lx-preloader-ring"></div>
                <p>Loading feedbacks...</p>
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="lx-no-feedback">
              <div className="lx-no-feedback-icon">💭</div>
              <p>No feedbacks yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="lx-feedbacks-list">
              {feedbacks.map((fb, index) => (
                <div
                  key={fb._id || index}
                  ref={index === feedbacks.length - 1 ? lastFeedbackElementRef : null}
                  className="lx-feedback-item"
                >
                  <div className="lx-feedback-content-text">
                    <p>{fb.feedback}</p>
                  </div>
                  <div className="lx-feedback-meta">
                    <span className="lx-time-ago">{timeAgo(fb.createdAt)}</span>
                    <div className="lx-feedback-actions">
                      <button className="lx-action-btn">👍</button>
                      <button className="lx-action-btn">❤️</button>
                    </div>
                  </div>
                </div>
              ))}
              
              {loadingMore && (
                <div className="lx-loading-more">
                  <div className="lx-spinner-small"></div>
                  <p>Loading more feedbacks...</p>
                </div>
              )}
              
              {!hasMore && feedbacks.length > 0 && (
                <div className="lx-end-message">
                  <p>🎉 You've seen all feedbacks!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}