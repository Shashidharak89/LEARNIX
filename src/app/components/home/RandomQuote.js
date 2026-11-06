"use client";

import { useState, useEffect, useRef } from "react";
import {
  QuoteIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import "./styles/RandomQuote.css";
import { authFetch } from "@/lib/clientAuth";

export default function RandomQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshIconRef = useRef(null);
  const quoteBadgeRef = useRef(null);
  const sparklesRef = useRef(null);

  const fetchQuote = async () => {
    setLoading(true);
    setError("");
    refreshIconRef.current?.startAnimation?.();

    try {
      const res = await authFetch("/api/quote");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuote(data);
    } catch (err) {
      setError("Failed to fetch quote. Please try again.");
    } finally {
      setLoading(false);
      refreshIconRef.current?.stopAnimation?.();
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <section className="rq-section" aria-label="Quote of the Moment">
      <div className="rq-container">
        {/* Soft Ambient Radial Background Aura */}
        <div className="rq-ambient-aura" />

        {/* Apple-style Widget Card with Yellow & Blue Learnix Theme */}
        <div className="rq-card">
          {/* Header Row */}
          <div className="rq-header">
            <div
              className="rq-label-badge"
              onMouseEnter={() => quoteBadgeRef.current?.startAnimation?.()}
              onMouseLeave={() => quoteBadgeRef.current?.stopAnimation?.()}
            >
              <div className="rq-icon-squircle">
                <QuoteIcon ref={quoteBadgeRef} size={15} />
              </div>
              <span className="rq-label">Quote of the Moment</span>
            </div>

            <button
              type="button"
              className="rq-refresh-btn"
              onClick={fetchQuote}
              disabled={loading}
              title="Get new quote"
              onMouseEnter={() => refreshIconRef.current?.startAnimation?.()}
              onMouseLeave={() => !loading && refreshIconRef.current?.stopAnimation?.()}
            >
              <RefreshCwIcon
                ref={refreshIconRef}
                size={14}
                className={`rq-refresh-icon ${loading ? "rq-spin" : ""}`}
              />
              <span>{loading ? "Updating…" : "New Quote"}</span>
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="rq-error-box">
              <div className="rq-error-info">
                <TriangleAlertIcon size={16} className="rq-error-icon" />
                <span>{error}</span>
              </div>
              <button type="button" className="rq-retry-btn" onClick={fetchQuote}>
                Retry
              </button>
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
                <div
                  className="rq-author-wrap"
                  onMouseEnter={() => sparklesRef.current?.startAnimation?.()}
                  onMouseLeave={() => sparklesRef.current?.stopAnimation?.()}
                >
                  <SparklesIcon ref={sparklesRef} size={15} className="rq-author-star" />
                  <span className="rq-author">{quote.author}</span>
                </div>

                {quote.tags && quote.tags.length > 0 && (
                  <div className="rq-tags">
                    {quote.tags.map((tag) => (
                      <span key={tag} className="rq-tag">
                        {tag}
                      </span>
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
