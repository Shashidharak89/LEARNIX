"use client";

import { useState, useEffect } from "react";
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
    <div className="rq-card">
      <div className="rq-header">
        <span className="rq-label">Quote of the moment</span>
        <button className="rq-refresh-btn" onClick={fetchQuote} disabled={loading} title="Get new quote">
          <svg
            className={`rq-refresh-icon ${loading ? "rq-spin" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          {loading ? "Loading…" : "New Quote"}
        </button>
      </div>

      {error && (
        <div className="rq-error">
          <span>⚠ {error}</span>
          <button className="rq-retry-btn" onClick={fetchQuote}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <div className="rq-skeleton-wrap">
          <div className="rq-sk rq-sk-line rq-sk-line--lg" />
          <div className="rq-sk rq-sk-line rq-sk-line--md" />
          <div className="rq-sk rq-sk-line rq-sk-line--sm" />
          <div className="rq-sk rq-sk-author" />
        </div>
      )}

      {!loading && !error && quote && (
        <>
          <blockquote className="rq-content">
            <span className="rq-open-quote">"</span>
            {quote.content}
            <span className="rq-close-quote">"</span>
          </blockquote>

          <div className="rq-footer">
            <div className="rq-author-wrap">
              <span className="rq-author-icon">✦</span>
              <span className="rq-author">{quote.author}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
