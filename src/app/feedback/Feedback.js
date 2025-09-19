"use client";

import { useEffect, useState } from "react";
import "./styles/Feedback.css"; // Import the CSS file

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch feedbacks from backend
  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Format "time ago"
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} sec${seconds !== 1 ? "s" : ""} ago`;
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: newFeedback }),
      });
      setNewFeedback("");
      fetchFeedbacks(); // Refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <div className="feedback-container">
      <p className="feedback-note">
        ⚠️ We don’t get your name or any other personal details.
      </p>

      <form onSubmit={handleSubmit} className="feedback-form">
        <input
          type="text"
          placeholder="Write your feedback..."
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          className="feedback-input"
        />
        <button type="submit" className="feedback-btn" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      <div className="feedback-list">
        <h3>Recent Feedbacks</h3>
        {feedbacks.length === 0 ? (
          <p className="no-feedback">No feedback yet.</p>
        ) : (
          feedbacks.map((fb) => (
            <div key={fb._id} className="feedback-item">
              <p>{fb.feedback}</p>
              <span className="time-ago">{timeAgo(fb.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
