"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheckIcon, SendIcon, TriangleAlertIcon, XIcon } from "@animateicons/react/lucide";
import "./SMFeedbackModal.css";

export default function SMFeedbackModal({ open, onClose }) {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const closeRef = useRef(null);
  const sendRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, sending]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = feedback.trim();
    if (!message || sending) return;

    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: message, pageName: "study_material" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your report.");
      setStatus("success");
      setFeedback("");
    } catch (error) {
      setStatus(error.message || "Could not send your report. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sm-feedback-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sm-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="sm-feedback-title">
        <button ref={closeRef} type="button" className="sm-feedback-close" onClick={onClose} aria-label="Close feedback form">
          <XIcon size={18} />
        </button>
        <div className="sm-feedback-mark"><TriangleAlertIcon size={22} aria-hidden="true" /></div>
        <p className="sm-feedback-eyebrow">STUDY MATERIALS</p>
        <h2 id="sm-feedback-title">Report a problem</h2>
        <p className="sm-feedback-description">Tell us what went wrong in the directory. Your note helps us keep materials easy to find.</p>

        {status === "success" ? (
          <div className="sm-feedback-success" role="status">
            <CircleCheckIcon size={21} aria-hidden="true" />
            <div><strong>Report sent</strong><span>Thanks for helping us improve Study Materials.</span></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sm-feedback-form">
            <label htmlFor="sm-feedback-message">What should we know?</label>
            <textarea
              id="sm-feedback-message"
              value={feedback}
              onChange={(event) => { setFeedback(event.target.value); setStatus(""); }}
              placeholder="Describe the issue or share an idea…"
              rows={5}
              maxLength={3000}
              required
              autoFocus
            />
            <div className="sm-feedback-form-footer">
              <span>{feedback.length}/3000</span>
              <button
                ref={sendRef}
                type="submit"
                disabled={!feedback.trim() || sending}
                onMouseEnter={() => sendRef.current?.querySelector("svg")?.startAnimation?.()}
                onMouseLeave={() => sendRef.current?.querySelector("svg")?.stopAnimation?.()}
              >
                <SendIcon size={16} aria-hidden="true" />
                {sending ? "Sending…" : "Send report"}
              </button>
            </div>
            {status && <p className="sm-feedback-error" role="alert">{status}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
