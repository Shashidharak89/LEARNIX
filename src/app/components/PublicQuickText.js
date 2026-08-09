"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FiClock,
  FiSend,
  FiMessageCircle,
  FiChevronRight,
  FiMoreVertical,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/PublicQuickText.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_LIMIT = 2;

const AVATAR_THEMES = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#f3e8ff", color: "#7e22ce" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef3c7", color: "#b45309" },
  { bg: "#ffe4e6", color: "#be123c" },
];

function getRemainingTime(createdAt) {
  if (!createdAt) return "24h 00m left";
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return "24h 00m left";
  const totalDuration = 24 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, totalDuration - (Date.now() - created));
  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m left`;
}

function getTimeAgo(createdAt) {
  if (!createdAt) return "Just now";
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return "Just now";
  const diffSec = Math.floor((Date.now() - created) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return "1d ago";
}

export default function PublicQuickText() {
  const [text, setText] = useState("");
  const [records, setRecords] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [justPosted, setJustPosted] = useState(false);

  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const cardRef = useRef(null);
  const headerRef = useRef(null);
  const inputBoxRef = useRef(null);
  const postsSectionRef = useRef(null);
  const disclaimerRef = useRef(null);

  const fetchLatest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public-texts?page=1&limit=${HOME_LIMIT}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load public texts");
        return;
      }
      setRecords(data.records || []);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Network error while loading public texts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  // Full-window pinned scroll-driven freezing entrance animation (Copied directly from RandomQuote)
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

      // Initial states matching Quote component
      gsap.set(card, { opacity: 0, scale: 0.85, y: 40, filter: "blur(10px)" });
      if (headerRef.current) {
        gsap.set(headerRef.current, { y: 20, opacity: 0 });
      }
      if (inputBoxRef.current) {
        gsap.set(inputBoxRef.current, { y: 22, opacity: 0 });
      }
      if (postsSectionRef.current) {
        gsap.set(postsSectionRef.current, { y: 20, opacity: 0 });
      }
      if (disclaimerRef.current) {
        gsap.set(disclaimerRef.current, { y: 16, opacity: 0 });
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

      // Step 2: Header reveals (t = 0.20 to 0.40)
      if (headerRef.current) {
        masterTl.to(headerRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.20,
          ease: "power2.out",
        }, 0.20);
      }

      // Step 3: Input box reveals (t = 0.35 to 0.55)
      if (inputBoxRef.current) {
        masterTl.to(inputBoxRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.20,
          ease: "power2.out",
        }, 0.35);
      }

      // Step 4: Posts list reveals (t = 0.50 to 0.70)
      if (postsSectionRef.current) {
        masterTl.to(postsSectionRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.20,
          ease: "power2.out",
        }, 0.50);
      }

      // Step 5: Disclaimer reveals (t = 0.65 to 0.75)
      if (disclaimerRef.current) {
        masterTl.to(disclaimerRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.15,
          ease: "power2.out",
        }, 0.65);
      }

      // Step 6: Freeze plateau for comfortable user reading (t = 0.75 to 1.0)
      masterTl.to(card, { duration: 0.25 }, 0.75);

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    });

    return () => ctx.revert();
  }, [records, loading]);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (!text.trim() || posting) return;

    setPosting(true);
    setError("");

    try {
      const res = await fetch("/api/public-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to post text");
        return;
      }

      setText("");
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 2000);
      await fetchLatest();
    } catch {
      setError("Network error while posting text");
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <section ref={sectionRef} className="pqt-pinned-section">
      <div ref={viewportRef} className="pqt-viewport">
        {/* Soft Ambient Radial Background Aura */}
        <div className="pqt-ambient-aura" />

        {/* Center Card */}
        <div ref={cardRef} className="pqt-card">
          {/* Header */}
          <div ref={headerRef} className="pqt-header-row">
            <h2 className="pqt-main-title">
              Share with the world <span className="pqt-sparkle-icon">✦</span>
            </h2>
            <div className="pqt-badge-pill">
              <FiClock size={12} />
              <span>Auto removes in 24h</span>
            </div>
          </div>

          {/* Input Box */}
          <div ref={inputBoxRef} className="pqt-input-box">
            <div className="pqt-input-label">
              <FiSend size={14} style={{ transform: "rotate(-30deg)" }} />
              <span>Write anything (public · 24h)</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pqt-textarea-container">
                <textarea
                  className="pqt-textarea"
                  placeholder="Share any short text publicly... (Press Enter to post)"
                  value={text}
                  maxLength={4000}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <div className="pqt-textarea-footer">
                  <span className="pqt-char-counter">{text.length} / 4000</span>
                  <button
                    className={`pqt-submit-btn ${justPosted ? "pqt-submit-btn--success" : ""}`}
                    type="submit"
                    disabled={posting || !text.trim()}
                  >
                    <FiSend size={14} className={posting ? "pqt-spin-icon" : ""} />
                    <span>{posting ? "Posting..." : justPosted ? "Posted! ✨" : "Post"}</span>
                  </button>
                </div>
              </div>
            </form>
            {error && <p className="pqt-error">{error}</p>}
          </div>

          {/* Posts List Section */}
          <div ref={postsSectionRef} className="pqt-posts-section">
            <div className="pqt-posts-header">
              <h3 className="pqt-posts-heading">
                <FiMessageCircle className="pqt-msg-icon" />
                <span>Latest public posts</span>
              </h3>
              <Link href="/public-texts" className="pqt-view-more-pill">
                <span>View More</span>
                <FiChevronRight size={13} />
              </Link>
            </div>

            <div className="pqt-posts-list">
              {loading ? (
                <div className="pqt-empty-card">Loading posts...</div>
              ) : records.length === 0 ? (
                <div className="pqt-empty-card">No public texts yet. Be the first one to post.</div>
              ) : (
                records.slice(0, 2).map((item, idx) => {
                  const avatar = AVATAR_THEMES[idx % AVATAR_THEMES.length];
                  return (
                    <article className="pqt-post-card" key={item._id}>
                      <div className="pqt-post-left">
                        <div
                          className="pqt-avatar-circle"
                          style={{ backgroundColor: avatar.bg, color: avatar.color }}
                        >
                          <FiUser size={16} />
                        </div>
                        <div className="pqt-post-content">
                          <div className="pqt-author-row">
                            <span className="pqt-author-name">Anonymous</span>
                            <span className="pqt-time-ago">{getTimeAgo(item.createdAt)}</span>
                          </div>
                          <p className="pqt-post-text">{item.text}</p>
                        </div>
                      </div>

                      <div className="pqt-post-right">
                        <div className="pqt-time-badge">
                          <FiClock size={11} />
                          <span>{getRemainingTime(item.createdAt)}</span>
                        </div>
                        <button
                          type="button"
                          className="pqt-more-options-btn"
                          aria-label="More options"
                        >
                          <FiMoreVertical size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div ref={disclaimerRef} className="pqt-disclaimer">
            <FiShield className="pqt-shield-icon" />
            <span>Be kind. Be real. Be you.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
