import { useState } from "react";
import './styles/Feedback.css';

export default function Feedback() {
  const [newFeedback, setNewFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-content">
        <style jsx>{`
          
        `}</style>

        {/* Header Section */}
        <div className="feedback-header">
          <h1 className="feedback-title">Share Your Feedback</h1>
          <p className="feedback-subtitle">
            Help us improve Learnix 
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          {/* <div className="privacy-icon">🔒</div> */}
          <p>We do not collect your name or any personal details. Your feedback is completely anonymous.</p>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="input-group">
            <textarea
              placeholder="Share your thoughts... (e.g., Rate our website, suggest improvements, report issues, or tell us what you love about Learnix)"
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="feedback-textarea"
              rows={4}
              maxLength={500}
            />
            <div className="char-counter">
              {newFeedback.length}/500
            </div>
          </div>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || !newFeedback.trim()}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </form>

        {/* Success Message */}
        {submitted && (
          <div className="success-message">
            <span>✓</span> Thank you! Your feedback has been submitted successfully.
          </div>
        )}

        {/* Feedback Suggestions */}
        <div className="feedback-suggestions">
          <h3 className="suggestions-title">What kind of feedback can you share?</h3>
          <div className="suggestion-tags">
            <span className="tag">🌟 Rate our website</span>
            <span className="tag">💡 Suggest improvements</span>
            <span className="tag">🐛 Report bugs or issues</span>
            <span className="tag">❤️ Share what you love</span>
            <span className="tag">📚 Request new features</span>
          </div>
        </div>

      </div>
    </div>
  );
}