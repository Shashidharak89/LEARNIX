"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BellIcon,
  ArrowRightIcon,
  ClockIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import { authFetch } from "@/lib/clientAuth";
import "./styles/UpdatesBanner.css";

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

function LiveUpdateItem({ update }) {
  return (
    <Link href={`/updates?id=${update._id || update.id}`} className="upb-item-card">
      <div className="upb-item-meta">
        <span className="upb-item-tag">
          <SparklesIcon size={12} />
          <span>{update.category || "Announcement"}</span>
        </span>
        {update.createdAt && (
          <span className="upb-item-time">
            <ClockIcon size={12} />
            <span>{formatRelativeTime(update.createdAt)}</span>
          </span>
        )}
      </div>

      <h4 className="upb-item-title">{update.title}</h4>
      <p className="upb-item-snippet">{update.content}</p>

      <div className="upb-item-footer">
        <span className="upb-item-author">
          By {update.authorName || update.authorUSN || "Campus Community"}
        </span>
        <span className="upb-item-read-link">
          Read update <ArrowRightIcon size={13} />
        </span>
      </div>
    </Link>
  );
}

export default function UpdatesBanner() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const badgeRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUpdates() {
      try {
        const res = await authFetch("/api/updates?index=1");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.updates)) {
            setUpdates(data.updates.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to fetch updates for homepage banner:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadUpdates();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="upb-section" aria-label="Updates Section">
      <div className="upb-card-container">
        {/* Pill Badge */}
        <div
          className="upb-badge-pill"
          onMouseEnter={() => badgeRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeRef.current?.stopAnimation?.()}
        >
          <div className="upb-badge-icon">
            <BellIcon ref={badgeRef} size={14} />
          </div>
          <span>Platform Section</span>
        </div>

        {/* Header Block */}
        <div className="upb-header-block">
          <div className="upb-title-area">
            <h2 className="upb-title">
              Explore <span className="upb-brand">UPDATES<span className="upb-underline" /></span>
            </h2>
            <p className="upb-subtitle">
              Browse the Updates section for real-time posts, community discussions, campus circulars, and college notifications.
            </p>
          </div>

          <Link
            href="/updates"
            className="upb-cta-btn"
            onMouseEnter={() => ctaRef.current?.startAnimation?.()}
            onMouseLeave={() => ctaRef.current?.stopAnimation?.()}
          >
            <span>Visit Updates</span>
            <ArrowRightIcon ref={ctaRef} size={16} />
          </Link>
        </div>

        {/* Live Content Grid */}
        <div className="upb-updates-grid">
          {loading ? (
            Array.from({ length: 3 }, (_, idx) => (
              <div key={idx} className="upb-item-card upb-skeleton-card">
                <div className="upb-skel-line w-30" />
                <div className="upb-skel-line w-75" />
                <div className="upb-skel-line w-90" />
                <div className="upb-skel-line w-50" />
              </div>
            ))
          ) : updates.length > 0 ? (
            updates.map((update, idx) => (
              <LiveUpdateItem key={update._id || update.id || idx} update={update} />
            ))
          ) : (
            <div className="upb-empty-state">
              <p>No active announcements right now. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
