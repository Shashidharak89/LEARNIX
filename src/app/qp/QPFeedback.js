"use client";

import { useState } from "react";
import { FiMessageSquare } from "react-icons/fi";

export default function QPFeedback() {
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <div className="qp-page-container" style={{ paddingBottom: "40px" }}>
      <div className="qp-main" style={{ margin: "16px auto 36px", padding: 0 }}>
        <section className="qp-card qp-feedback-card" aria-labelledby="qp-feedback-section">
          <div className="qp-feedback-head">
            <div className="qp-feedback-icon-pill" aria-hidden="true">
              <FiMessageSquare size={18} />
            </div>
            <div>
              <h3 id="qp-feedback-section" className="qp-feedback-title">Facing Any Issues?</h3>
              <p className="qp-feedback-desc">
                Let us know if you are facing problems finding or downloading question papers, or have suggestions.
              </p>
            </div>
          </div>
          <div className="qp-feedback-body">
            <textarea
              placeholder="Describe the issue or suggestion..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="qp-feedback-textarea"
              rows={3}
            />
            <div className="qp-feedback-footer">
              <button
                type="button"
                className="qp-feedback-btn"
                disabled={sending || !feedback.trim()}
                onClick={async () => {
                  try {
                    setSending(true);
                    await fetch("/api/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ feedback }),
                    });
                    setFeedback("");
                    alert("Thank you! Your feedback has been sent.");
                  } catch {
                    alert("Failed to send feedback. Please try again.");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? "Sending..." : "Send Feedback"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
