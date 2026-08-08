"use client";

import { useState, useEffect, useRef } from "react";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./RandomQuote.css";
import { authFetch } from "@/lib/clientAuth";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function RandomQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const cardRef = useRef(null);
  const openQuoteRef = useRef(null);
  const closeQuoteRef = useRef(null);
  const quoteTextRef = useRef(null);
  const authorRef = useRef(null);
  const containerRef = useRef(null);

  // Full-window pinned scroll-driven freezing entrance animation
  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=900", // Freezing scrub distance
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Initial states
      gsap.set(card, { opacity: 0, scale: 0.85, y: 40, filter: "blur(10px)" });
      if (openQuoteRef.current && closeQuoteRef.current) {
        gsap.set([openQuoteRef.current, closeQuoteRef.current], { scale: 0.3, opacity: 0, color: "#ef4444" });
      }
      if (quoteTextRef.current) {
        gsap.set(quoteTextRef.current, { y: 22, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
      }
      if (authorRef.current) {
        gsap.set(authorRef.current, { y: 16, opacity: 0 });
      }

      // Step 1: Card enters viewport & centers (t = 0 to 0.25)
      masterTl.to(card, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.25,
        ease: "power2.out",
      }, 0);

      // Step 2: Large quotation marks pop up (t = 0.20 to 0.40)
      if (openQuoteRef.current && closeQuoteRef.current) {
        masterTl.to([openQuoteRef.current, closeQuoteRef.current], {
          scale: 1,
          opacity: 1,
          color: "#dc2626",
          duration: 0.20,
          ease: "back.out(1.5)",
        }, 0.20);
      }

      // Step 3: Quote text line-by-line mask reveal (t = 0.35 to 0.60)
      if (quoteTextRef.current) {
        masterTl.to(quoteTextRef.current, {
          y: 0,
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.25,
          ease: "power2.out",
        }, 0.35);
      }

      // Step 4: Author & tags reveal (t = 0.55 to 0.75)
      if (authorRef.current) {
        masterTl.to(authorRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.20,
          ease: "power2.out",
        }, 0.55);
      }

      // Step 5: Freeze plateau for comfortable user reading (t = 0.75 to 1.0)
      masterTl.to(card, { duration: 0.25 }, 0.75);

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    });

    return () => ctx.revert();
  }, [quote, loading]);

  const fetchQuote = async () => {
    if (isChanging) return;
    setIsChanging(true);

    // If we already have a quote displayed, perform smooth horizontal slide out
    if (openQuoteRef.current && quoteTextRef.current && authorRef.current) {
      await gsap.to([openQuoteRef.current, closeQuoteRef.current, quoteTextRef.current, authorRef.current], {
        x: -35,
        opacity: 0,
        duration: 0.22,
        ease: "power2.in",
      });
    }

    setLoading(true);
    setError("");

    try {
      const res = await authFetch("/api/quote");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuote(data);

      // Slide in new quote from right
      setTimeout(() => {
        if (openQuoteRef.current && quoteTextRef.current && authorRef.current) {
          gsap.fromTo(
            [openQuoteRef.current, closeQuoteRef.current, quoteTextRef.current, authorRef.current],
            { x: 35, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.04 }
          );
        }
      }, 40);
    } catch (err) {
      setError("Failed to fetch quote. Please try again.");
    } finally {
      setLoading(false);
      setIsChanging(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <section ref={sectionRef} className="rq-pinned-section">
      <div ref={viewportRef} className="rq-viewport">
        {/* Soft Ambient Radial Background Aura */}
        <div className="rq-ambient-aura" />

        {/* Center Quote Card */}
        <div ref={cardRef} className="rq-card">
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
              disabled={loading || isChanging}
              title="Get new quote"
            >
              <FiRefreshCw className={`rq-refresh-icon ${loading || isChanging ? "rq-spin" : ""}`} />
              <span>{loading || isChanging ? "Updating…" : "New Quote"}</span>
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
            <div ref={containerRef} className="rq-body-container">
              <blockquote className="rq-content">
                <span ref={openQuoteRef} className="rq-quote-mark rq-open-quote">“</span>
                <span ref={quoteTextRef} className="rq-quote-text">{quote.content}</span>
                <span ref={closeQuoteRef} className="rq-quote-mark rq-close-quote">”</span>
              </blockquote>

              <div ref={authorRef} className="rq-footer">
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
