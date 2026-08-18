"use client";

import { useState, useEffect } from "react";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import "./RandomQuote.css";
import { authFetch } from "@/lib/clientAuth";

export default function RandomQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuote = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await authFetch("/api/quote");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuote(data);
    } catch (err) {
      setError("Failed to fetch quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <section className="rq-section">
      <div className="rq-container">
        {/* Soft Ambient Radial Background Aura */}
        <div className="rq-ambient-aura" />

        {/* Center Quote Card */}
        <div className="rq-card">
          {/* Header */}
          <div className="rq-header">
            <div className="rq-label-badge">
              <span className="rq-dot-red" />
              <span className="rq-label">Quote of the Month</span>
            </div>
            <button
              type="button"
              className="rq-refresh-btn"
              onClick={fetchQuote}
              disabled={loading}
              title="Get new quote"
            >
              <FiRefreshCw className={`rq-refresh-icon ${loading ? "rq-spin" : ""}`} />
              <span>{loading ? "Updating…" : "New Quote"}</span>
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="rq-error-box">
              <div className="rq-error-info">
                <FiAlertCircle className="rq-error-icon" />
                <span>{error}</span>
              </div>
              <button type="button" className="rq-retry-btn" onClick={fetchQuote}>Retry</button>
            </div>
          )}

          {/* Initial Loading Skeleton State */}
          {loading && !quote && !error && (
            <div className="rq-skeleton-wrap">
              <div className="rq-sk rq-sk-line rq-sk-line--lg" />
              <div className="rq-sk rq-sk-line rq-sk-line--md" />
              <div className="rq-sk rq-sk-author" />
            </div>
          )}

          {/* Active Quote Display */}
          {!error && quote && (
            <div className="rq-body-container">
              <blockquote className="rq-content">
                <span className="rq-quote-mark rq-open-quote">“</span>
                <span className="rq-quote-text">{quote.content}</span>
                <span className="rq-quote-mark rq-close-quote">”</span>
              </blockquote>

              <div className="rq-footer">
                <div className="rq-author-wrap">
                  <span className="rq-author-star">✦</span>
                  <span className="rq-author">{quote.author}</span>
                </div>
                {quote.tags && quote.tags.length > 0 && (
                  <div className="rq-tags">
                    {quote.tags.map((tag) => (
                      <span key={tag} className="rq-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
