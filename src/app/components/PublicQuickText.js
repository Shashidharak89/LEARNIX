"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FiClock, FiEdit3, FiChevronDown, FiSend } from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/PublicQuickText.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_LIMIT = 3;

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
  const headerTitleRef = useRef(null);
  const chipRef = useRef(null);
  const textareaRef = useRef(null);
  const submitBtnRef = useRef(null);
  const dividerRef = useRef(null);
  const listTitleRef = useRef(null);
  const itemsRef = useRef([]);
  const moreBtnRef = useRef(null);

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
      gsap.set(card, { opacity: 0, scale: 0.9, y: 30, filter: "blur(12px)" });

      if (headerTitleRef.current) {
        gsap.set(headerTitleRef.current, { x: -35, y: -30, rotate: -5, opacity: 0, filter: "blur(8px)" });
      }

      if (chipRef.current) {
        gsap.set(chipRef.current, { x: 35, y: -30, rotate: 5, opacity: 0, filter: "blur(8px)" });
      }

      if (textareaRef.current) {
        gsap.set(textareaRef.current, { scale: 0.88, y: 25, opacity: 0, filter: "blur(10px)" });
      }

      if (submitBtnRef.current) {
        gsap.set(submitBtnRef.current, { x: 45, y: 15, rotate: 6, opacity: 0, scale: 0.8 });
      }

      if (dividerRef.current) {
        gsap.set(dividerRef.current, { scaleX: 0, transformOrigin: "left center", opacity: 0 });
      }

      if (listTitleRef.current) {
        gsap.set(listTitleRef.current, { x: -30, y: 15, opacity: 0, filter: "blur(6px)" });
      }

      const validItems = itemsRef.current.filter(Boolean);
      validItems.forEach((item, idx) => {
        const rot = idx % 2 === 0 ? -3 : 3;
        gsap.set(item, { y: 35, scale: 0.88, rotate: rot, opacity: 0, filter: "blur(8px)" });
      });

      if (moreBtnRef.current) {
        gsap.set(moreBtnRef.current, { y: 25, scale: 0.82, opacity: 0, filter: "blur(6px)" });
      }

      // Step 0: Card container enters (0 -> 0.20)
      masterTl.to(card, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.20,
        ease: "power2.out",
      }, 0);

      // Step 1: Header title & 24h chip fly into position (0.15 -> 0.35)
      if (headerTitleRef.current && chipRef.current) {
        masterTl.to([headerTitleRef.current, chipRef.current], {
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.20,
          ease: "back.out(1.4)",
          stagger: 0.05,
        }, 0.15);
      }

      // Step 2: Textarea expands into place (0.30 -> 0.50)
      if (textareaRef.current) {
        masterTl.to(textareaRef.current, {
          scale: 1,
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.20,
          ease: "power2.out",
        }, 0.30);
      }

      // Step 3: Post button slides in from side (0.40 -> 0.58)
      if (submitBtnRef.current) {
        masterTl.to(submitBtnRef.current, {
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          scale: 1,
          duration: 0.18,
          ease: "back.out(1.5)",
        }, 0.40);
      }

      // Step 4: Divider draws across (0.52 -> 0.68)
      if (dividerRef.current) {
        masterTl.to(dividerRef.current, {
          scaleX: 1,
          opacity: 1,
          duration: 0.16,
          ease: "power2.inOut",
        }, 0.52);
      }

      // Step 5: Latest-post heading slides into position (0.55 -> 0.70)
      if (listTitleRef.current) {
        masterTl.to(listTitleRef.current, {
          x: 0,
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.16,
          ease: "power2.out",
        }, 0.55);
      }

      // Step 6: Posts appear one-by-one with staggered fade + scale (0.65 -> 0.82)
      if (validItems.length > 0) {
        masterTl.to(validItems, {
          y: 0,
          scale: 1,
          rotate: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.18,
          ease: "back.out(1.2)",
          stagger: 0.06,
        }, 0.65);
      }

      // Step 7: View More button settles in last (0.80 -> 0.92)
      if (moreBtnRef.current) {
        masterTl.to(moreBtnRef.current, {
          y: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.14,
          ease: "back.out(1.4)",
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

  itemsRef.current = [];

  return (
    <section ref={sectionRef} className="pqt-pinned-section" aria-label="Public quick text sharing">
      <div ref={viewportRef} className="pqt-viewport">
        <div className="pqt-ambient-aura" />

        <div ref={cardRef} className="pqt-card">
          <div className="pqt-head">
            <h3 ref={headerTitleRef} className="pqt-title">
              <FiEdit3 size={16} /> Write anything (public · 24h)
            </h3>
            <span ref={chipRef} className="pqt-chip">
              <FiClock size={12} /> Auto removes in 24h
            </span>
          </div>

          <form className="pqt-form" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="pqt-textarea"
              placeholder="Share any short text publicly..."
              value={text}
              maxLength={4000}
              onChange={(event) => setText(event.target.value)}
            />
            <button
              ref={submitBtnRef}
              className="pqt-submit"
              type="submit"
              disabled={posting || !text.trim()}
            >
              <FiSend size={14} /> {posting ? "Posting..." : "Post"}
            </button>
          </form>

          {error && <p className="pqt-error">{error}</p>}

          <div ref={dividerRef} className="pqt-divider" />

          <div className="pqt-list-wrap">
            <h4 ref={listTitleRef} className="pqt-list-title">Latest public posts</h4>

            {loading ? (
              <p ref={(el) => (itemsRef.current[0] = el)} className="pqt-empty">Loading...</p>
            ) : records.length === 0 ? (
              <p ref={(el) => (itemsRef.current[0] = el)} className="pqt-empty">
                No public texts yet. Be the first one.
              </p>
            ) : (
              <div className="pqt-list">
                {records.map((item, idx) => (
                  <article
                    ref={(el) => (itemsRef.current[idx] = el)}
                    className="pqt-item"
                    key={item._id}
                  >
                    <p className="pqt-item-text">{item.text}</p>
                    <time className="pqt-item-time">{formatDateTime(item.createdAt)}</time>
                  </article>
                ))}
              </div>
            )}

            {hasMore && (
              <div ref={moreBtnRef} className="pqt-more-wrap">
                <Link href="/public-texts" className="pqt-more-btn">
                  <FiChevronDown size={15} /> View More
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
