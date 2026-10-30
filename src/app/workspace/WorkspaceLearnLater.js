"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  BookmarkIcon,
  ClockIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  LogInIcon,
  FolderIcon,
  BellIcon,
  BookOpenIcon,
  FileTextIcon,
} from "@animateicons/react/lucide";
import { authFetch } from "@/lib/clientAuth";
import "./styles/WorkspaceLearnLater.css";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getItemTypeMeta(rawType) {
  const t = String(rawType || "").toLowerCase();
  if (t.includes("update")) {
    return {
      label: "Update",
      icon: BellIcon,
      className: "wll-type-update",
    };
  }
  if (t.includes("material") || t.includes("sm")) {
    return {
      label: "Study Material",
      icon: BookOpenIcon,
      className: "wll-type-material",
    };
  }
  if (t.includes("paper") || t.includes("qp")) {
    return {
      label: "Question Paper",
      icon: FileTextIcon,
      className: "wll-type-qp",
    };
  }
  return {
    label: "Resource Topic",
    icon: FolderIcon,
    className: "wll-type-resource",
  };
}

function LearnLaterItemCard({ item }) {
  const clockRef = useRef(null);
  const extRef = useRef(null);
  const typeIconRef = useRef(null);
  const meta = getItemTypeMeta(item.type);
  const TypeIcon = meta.icon;
  const targetUrl = item.url || "/works";

  return (
    <div
      className="wll-item-card"
      onMouseEnter={() => {
        clockRef.current?.startAnimation?.();
        extRef.current?.startAnimation?.();
        typeIconRef.current?.startAnimation?.();
      }}
      onMouseLeave={() => {
        clockRef.current?.stopAnimation?.();
        extRef.current?.stopAnimation?.();
        typeIconRef.current?.stopAnimation?.();
      }}
    >
      <div className="wll-card-header">
        <div className="wll-header-titles">
          <div className="wll-badges-row">
            <span className={`wll-type-pill ${meta.className}`}>
              <TypeIcon ref={typeIconRef} size={12} />
              <span>{meta.label}</span>
            </span>

            {item.subtitle && (
              <span className="wll-subtitle-pill" title={item.subtitle}>
                <span>{item.subtitle}</span>
              </span>
            )}
          </div>

          <h4 className="wll-card-title">
            <Link href={targetUrl} className="wll-title-link" title={item.title}>
              {item.title || "Saved Item"}
            </Link>
          </h4>
        </div>
      </div>

      {item.description && <p className="wll-card-desc">{item.description}</p>}

      <div className="wll-card-meta">
        <div className="wll-meta-left">
          <span className="wll-meta-time">
            <ClockIcon ref={clockRef} size={13} />
            <span>{formatTimeAgo(item.createdAt)}</span>
          </span>
        </div>

        <Link
          href={targetUrl}
          className="wll-card-view-link"
          title="Open saved item"
        >
          <span>View</span>
          <ExternalLinkIcon ref={extRef} size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function WorkspaceLearnLater({ loggedIn }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const bookmarkIconRef = useRef(null);
  const topActionIconRef = useRef(null);
  const lockEmptyRef = useRef(null);
  const loginIconRef = useRef(null);
  const emptyBookmarkRef = useRef(null);
  const emptyExploreRef = useRef(null);

  const fetchLatestSavedItems = useCallback(async () => {
    if (!loggedIn) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await authFetch("/api/learn-later?sort=newest");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.items) ? data.items : [];
        setItems(list.slice(0, 3));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch learn later items:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [loggedIn]);

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next && !hasFetched && loggedIn) {
        fetchLatestSavedItems();
        setHasFetched(true);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleSync = () => {
      if (isExpanded) {
        fetchLatestSavedItems();
      } else {
        setHasFetched(false);
      }
    };

    window.addEventListener("learnix:learn-later-updated", handleSync);
    return () => window.removeEventListener("learnix:learn-later-updated", handleSync);
  }, [fetchLatestSavedItems, isExpanded]);

  return (
    <section className="wll-section-wrapper" aria-label="Learn Later">
      {/* Main Apple Card Widget */}
      <div className="wll-widget-card">
        {/* Header Row - strictly 1 row on ALL screen widths */}
        <div className="wll-widget-header">
          <div
            className="wll-header-title-group"
            onClick={toggleExpand}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleExpand();
              }
            }}
          >
            <div
              className="wll-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => bookmarkIconRef.current?.startAnimation?.()}
              onMouseLeave={() => bookmarkIconRef.current?.stopAnimation?.()}
            >
              <BookmarkIcon ref={bookmarkIconRef} size={22} />
            </div>
            <div className="wll-title-text-group">
              <h3 className="wll-section-title">Learn Later</h3>
              <span className="wll-section-subtitle">Saved materials & topics queued for revision</span>
            </div>
          </div>

          <div className="wll-header-actions">
            <Link
              href="/learn-later"
              className="wll-top-visit-btn"
              onMouseEnter={() => topActionIconRef.current?.startAnimation?.()}
              onMouseLeave={() => topActionIconRef.current?.stopAnimation?.()}
              title="Visit your complete Learn Later page"
            >
              <span>Visit Learn Later</span>
              <ArrowRightIcon ref={topActionIconRef} size={15} />
            </Link>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          <div className="wll-widget-body">
            {isLoading && (
              <div className="wll-skeleton-stack">
                <div className="wll-skeleton-card" />
                <div className="wll-skeleton-card" />
                <div className="wll-skeleton-card" />
              </div>
            )}

            {!isLoading && !loggedIn && (
              <div
                className="wll-empty-state wll-empty-guest"
                onMouseEnter={() => lockEmptyRef.current?.startAnimation?.()}
                onMouseLeave={() => lockEmptyRef.current?.stopAnimation?.()}
              >
                <div className="wll-empty-icon-wrap">
                  <BookmarkIcon ref={lockEmptyRef} size={22} />
                </div>
                <h4 className="wll-empty-title">Sign in to view your Learn Later queue</h4>
                <p className="wll-empty-desc">
                  Save study topics, campus announcements, question papers, and notes to access them whenever you study.
                </p>
                <Link
                  href="/login?redirect=/learn-later"
                  className="wll-empty-action-btn"
                  onMouseEnter={() => loginIconRef.current?.startAnimation?.()}
                  onMouseLeave={() => loginIconRef.current?.stopAnimation?.()}
                >
                  <LogInIcon ref={loginIconRef} size={15} />
                  <span>Sign In to Continue</span>
                </Link>
              </div>
            )}

            {!isLoading && loggedIn && items.length === 0 && (
              <div
                className="wll-empty-state"
                onMouseEnter={() => emptyBookmarkRef.current?.startAnimation?.()}
                onMouseLeave={() => emptyBookmarkRef.current?.stopAnimation?.()}
              >
                <div className="wll-empty-icon-wrap">
                  <BookmarkIcon ref={emptyBookmarkRef} size={22} />
                </div>
                <h4 className="wll-empty-title">Your Learn Later queue is empty</h4>
                <p className="wll-empty-desc">
                  Tap the bookmark icon or Learn Later option on any study material or update to keep it ready for later review.
                </p>
                <Link
                  href="/works"
                  className="wll-empty-action-btn"
                  onMouseEnter={() => emptyExploreRef.current?.startAnimation?.()}
                  onMouseLeave={() => emptyExploreRef.current?.stopAnimation?.()}
                >
                  <FolderIcon ref={emptyExploreRef} size={15} />
                  <span>Explore Academic Resources</span>
                </Link>
              </div>
            )}

            {!isLoading && loggedIn && items.length > 0 && (
              <div className="wll-cards-list">
                {items.map((item) => (
                  <LearnLaterItemCard
                    key={item.itemId || item.id || item._id}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
