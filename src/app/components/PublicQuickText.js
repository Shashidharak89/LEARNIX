"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FiClock,
  FiSend,
  FiImage,
  FiSmile,
  FiMessageCircle,
  FiChevronRight,
  FiMoreVertical,
  FiShield,
} from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/PublicQuickText.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_LIMIT = 3;

const AVATAR_THEMES = [
  { bg: "#dbeafe", color: "#1d4ed8", name: "Sanketh", initial: "S" },
  { bg: "#f3e8ff", color: "#7e22ce", name: "Ananya", initial: "A" },
  { bg: "#dcfce7", color: "#15803d", name: "Rahul", initial: "R" },
  { bg: "#fef3c7", color: "#b45309", name: "Kiran", initial: "K" },
  { bg: "#ffe4e6", color: "#be123c", name: "Priya", initial: "P" },
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

  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const cardRef = useRef(null);
  const headerLeftRef = useRef(null);
  const headerRightRef = useRef(null);
  const planeSvgRef = useRef(null);
  const inputBoxRef = useRef(null);
  const postsHeaderRef = useRef(null);
  const viewMoreRef = useRef(null);
  const postCardsRef = useRef([]);
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

  // Scroll-driven puzzle assembly animation
  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=950",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Initial state: Card background & Puzzle elements scattered
      gsap.set(card, { opacity: 0, scale: 0.88, y: 40, filter: "blur(14px)" });

      if (headerLeftRef.current) {
        gsap.set(headerLeftRef.current, { x: -40, y: -30, rotate: -4, opacity: 0, filter: "blur(8px)" });
      }

      if (headerRightRef.current) {
        gsap.set(headerRightRef.current, { x: 40, y: -30, rotate: 4, opacity: 0, filter: "blur(8px)" });
      }

      if (planeSvgRef.current) {
        gsap.set(planeSvgRef.current, { x: 50, y: -40, scale: 0.6, opacity: 0 });
      }

      if (inputBoxRef.current) {
        gsap.set(inputBoxRef.current, { scale: 0.9, y: 30, opacity: 0, filter: "blur(10px)" });
      }

      if (postsHeaderRef.current) {
        gsap.set(postsHeaderRef.current, { x: -35, y: 20, opacity: 0, filter: "blur(8px)" });
      }

      if (viewMoreRef.current) {
        gsap.set(viewMoreRef.current, { x: 35, y: 20, opacity: 0, filter: "blur(6px)" });
      }

      const validCards = postCardsRef.current.filter(Boolean);
      validCards.forEach((postCard, idx) => {
        const rot = idx % 2 === 0 ? -2.5 : 2.5;
        gsap.set(postCard, { y: 40, scale: 0.88, rotate: rot, opacity: 0, filter: "blur(8px)" });
      });

      if (disclaimerRef.current) {
        gsap.set(disclaimerRef.current, { y: 20, opacity: 0, filter: "blur(6px)" });
      }

      // Step 0: Outer Card container enters (0 -> 0.18)
      masterTl.to(card, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.18,
        ease: "power2.out",
      }, 0);

      // Step 1: Header title + Plane + 24h pill fly into position (0.14 -> 0.34)
      if (headerLeftRef.current) {
        masterTl.to(headerLeftRef.current, {
          x: 0, y: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 0.20, ease: "back.out(1.4)"
        }, 0.14);
      }

      if (planeSvgRef.current) {
        masterTl.to(planeSvgRef.current, {
          x: 0, y: 0, scale: 1, opacity: 1, duration: 0.22, ease: "back.out(1.5)"
        }, 0.16);
      }

      if (headerRightRef.current) {
        masterTl.to(headerRightRef.current, {
          x: 0, y: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 0.20, ease: "back.out(1.4)"
        }, 0.18);
      }

      // Step 2: Input Box expands & settles into place (0.30 -> 0.52)
      if (inputBoxRef.current) {
        masterTl.to(inputBoxRef.current, {
          scale: 1, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.22, ease: "power2.out"
        }, 0.30);
      }

      // Step 3: Posts Header & View More button slide in (0.48 -> 0.66)
      if (postsHeaderRef.current) {
        masterTl.to(postsHeaderRef.current, {
          x: 0, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power2.out"
        }, 0.48);
      }

      if (viewMoreRef.current) {
        masterTl.to(viewMoreRef.current, {
          x: 0, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "back.out(1.4)"
        }, 0.52);
      }

      // Step 4: Individual Post cards appear with staggered entrance (0.62 -> 0.84)
      if (validCards.length > 0) {
        masterTl.to(validCards, {
          y: 0, scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "back.out(1.2)", stagger: 0.06
        }, 0.62);
      }

      // Step 5: Disclaimer settles in at bottom (0.80 -> 0.92)
      if (disclaimerRef.current) {
        masterTl.to(disclaimerRef.current, {
          y: 0, opacity: 1, filter: "blur(0px)", duration: 0.12, ease: "power2.out"
        }, 0.80);
      }

      // Hold plateau (0.85 -> 1.0)
      masterTl.to(card, { duration: 0.15 }, 0.85);

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    });

    return () => ctx.revert();
  }, [records, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      await fetchLatest();
    } catch {
      setError("Network error while posting text");
    } finally {
      setPosting(false);
    }
  };

  postCardsRef.current = [];

  return (
    <section ref={sectionRef} className="pqt-pinned-section" aria-label="Public quick text sharing">
      <div ref={viewportRef} className="pqt-viewport">
        <div className="pqt-ambient-aura" />

        <div ref={cardRef} className="pqt-card">
          {/* Top Header Row */}
          <div className="pqt-header-row">
            <div ref={headerLeftRef} className="pqt-header-left">
              <h2 className="pqt-main-title">
                Share with the world <span className="pqt-sparkle-icon">✦</span>
              </h2>
              <p className="pqt-main-subtitle">
                Write anything publicly. It stays for 24 hours and then disappears.
              </p>
            </div>

            {/* Floating Paper Plane Decoration */}
            <div ref={planeSvgRef} className="pqt-plane-wrap" aria-hidden="true">
              <svg className="pqt-plane-svg" viewBox="0 0 200 60" fill="none">
                <path
                  d="M10 45 C 60 10, 130 60, 180 15"
                  stroke="#c7d2fe"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path d="M40 25 L43 28 L40 31 L37 28 Z" fill="#ec4899" opacity="0.6" />
                <path d="M115 15 L118 18 L115 21 L112 18 Z" fill="#8b5cf6" opacity="0.6" />
                <path d="M160 32 L162 34 L160 36 L158 34 Z" fill="#3b82f6" opacity="0.6" />
              </svg>
              <div className="pqt-plane-icon">
                <FiSend />
              </div>
            </div>

            <div ref={headerRightRef} className="pqt-header-right">
              <div className="pqt-badge-pill">
                <FiClock size={13} />
                <span>Auto removes in 24h</span>
              </div>
            </div>
          </div>

          {/* Inner Input Card */}
          <div ref={inputBoxRef} className="pqt-input-box">
            <div className="pqt-input-label">
              <FiSend size={15} style={{ transform: "rotate(-30deg)" }} />
              <span>Write anything (public · 24h)</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pqt-textarea-container">
                <textarea
                  className="pqt-textarea"
                  placeholder="Share any short text publicly..."
                  value={text}
                  maxLength={4000}
                  onChange={(event) => setText(event.target.value)}
                />

                <div className="pqt-textarea-footer">
                  <div className="pqt-actions-left">
                    <button type="button" className="pqt-action-icon-btn" title="Add image">
                      <FiImage size={17} />
                    </button>
                    <button type="button" className="pqt-action-icon-btn" title="Add GIF">
                      <span className="pqt-gif-badge">GIF</span>
                    </button>
                    <button type="button" className="pqt-action-icon-btn" title="Add emoji">
                      <FiSmile size={17} />
                    </button>
                  </div>

                  <div className="pqt-footer-right">
                    <span className="pqt-char-counter">{text.length} / 4000</span>
                    <button
                      className="pqt-submit-btn"
                      type="submit"
                      disabled={posting || !text.trim()}
                    >
                      <FiSend size={14} />
                      <span>{posting ? "Posting..." : "Post"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
            {error && <p className="pqt-error">{error}</p>}
          </div>

          {/* Latest Public Posts Section */}
          <div className="pqt-posts-section">
            <div className="pqt-posts-header">
              <div ref={postsHeaderRef} className="pqt-posts-title-wrap">
                <h3 className="pqt-posts-heading">
                  <FiMessageCircle className="pqt-msg-icon" />
                  <span>Latest public posts</span>
                </h3>
                <p className="pqt-posts-subheading">Real thoughts. Real people.</p>
              </div>

              <div ref={viewMoreRef}>
                <Link href="/public-texts" className="pqt-view-more-pill">
                  <span>View More</span>
                  <FiChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Posts List */}
            <div className="pqt-posts-list">
              {loading ? (
                <div
                  ref={(el) => (postCardsRef.current[0] = el)}
                  className="pqt-empty-card"
                >
                  Loading posts...
                </div>
              ) : records.length === 0 ? (
                <div
                  ref={(el) => (postCardsRef.current[0] = el)}
                  className="pqt-empty-card"
                >
                  No public texts yet. Be the first one to post.
                </div>
              ) : (
                records.map((item, idx) => {
                  const avatar = AVATAR_THEMES[idx % AVATAR_THEMES.length];
                  return (
                    <article
                      ref={(el) => (postCardsRef.current[idx] = el)}
                      className="pqt-post-card"
                      key={item._id}
                    >
                      <div className="pqt-post-left">
                        <div
                          className="pqt-avatar-circle"
                          style={{ backgroundColor: avatar.bg, color: avatar.color }}
                        >
                          {avatar.initial}
                        </div>
                        <div className="pqt-post-content">
                          <div className="pqt-author-row">
                            <span className="pqt-author-name">{avatar.name}</span>
                            <span className="pqt-time-ago">{getTimeAgo(item.createdAt)}</span>
                          </div>
                          <p className="pqt-post-text">{item.text}</p>
                        </div>
                      </div>

                      <div className="pqt-post-right">
                        <div className="pqt-time-badge">
                          <FiClock size={12} />
                          <span>{getRemainingTime(item.createdAt)}</span>
                        </div>
                        <button
                          type="button"
                          className="pqt-more-options-btn"
                          aria-label="More options"
                        >
                          <FiMoreVertical size={16} />
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
