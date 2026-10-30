"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FolderIcon,
  PlusIcon,
  GlobeIcon,
  LockIcon,
  LinkIcon,
  ClockIcon,
  FileTextIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  LogInIcon,
  BookOpenIcon,
} from "@animateicons/react/lucide";
import { authFetch } from "@/lib/clientAuth";
import "./styles/WorkspaceResources.css";

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

function VisibilityBadge({ visibility = "public" }) {
  const norm = String(visibility || "public").toLowerCase();
  const iconRef = useRef(null);

  if (norm === "private") {
    return (
      <span
        className="wr-vis-pill wr-vis-private"
        onMouseEnter={() => iconRef.current?.startAnimation?.()}
        onMouseLeave={() => iconRef.current?.stopAnimation?.()}
      >
        <LockIcon ref={iconRef} size={12} />
        <span>Private</span>
      </span>
    );
  }
  if (norm === "unlisted") {
    return (
      <span
        className="wr-vis-pill wr-vis-unlisted"
        onMouseEnter={() => iconRef.current?.startAnimation?.()}
        onMouseLeave={() => iconRef.current?.stopAnimation?.()}
      >
        <LinkIcon ref={iconRef} size={12} />
        <span>Unlisted</span>
      </span>
    );
  }
  return (
    <span
      className="wr-vis-pill wr-vis-public"
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <GlobeIcon ref={iconRef} size={12} />
      <span>Public</span>
    </span>
  );
}

function ResourceTopicCard({ topic }) {
  const clockRef = useRef(null);
  const extRef = useRef(null);
  const fileRef = useRef(null);
  const bookRef = useRef(null);

  return (
    <div
      className="wr-resource-card"
      onMouseEnter={() => {
        clockRef.current?.startAnimation?.();
        extRef.current?.startAnimation?.();
        bookRef.current?.startAnimation?.();
      }}
      onMouseLeave={() => {
        clockRef.current?.stopAnimation?.();
        extRef.current?.stopAnimation?.();
        bookRef.current?.stopAnimation?.();
      }}
    >
      <div className="wr-card-header">
        <div className="wr-header-titles">
          {topic.subjectName && (
            <Link
              href={`/resources/subject/${topic.subjectId}`}
              className="wr-subject-badge"
              title={`View subject: ${topic.subjectName}`}
            >
              <BookOpenIcon ref={bookRef} size={12} />
              <span>{topic.subjectName}</span>
            </Link>
          )}
          <h4 className="wr-card-title">
            <Link href={`/resources/${topic._id}`} className="wr-title-link" title={topic.topic}>
              {topic.topic || "Resource Topic"}
            </Link>
          </h4>
        </div>
        <VisibilityBadge visibility={topic.visibility} />
      </div>

      {topic.content && <p className="wr-card-desc">{topic.content}</p>}

      <div className="wr-card-meta">
        <div className="wr-meta-left">
          <span className="wr-meta-time">
            <ClockIcon ref={clockRef} size={13} />
            <span>{formatTimeAgo(topic.timestamp)}</span>
          </span>

          {topic.imagesCount > 0 && (
            <span
              className="wr-meta-pill"
              onMouseEnter={() => fileRef.current?.startAnimation?.()}
              onMouseLeave={() => fileRef.current?.stopAnimation?.()}
            >
              <FileTextIcon ref={fileRef} size={13} />
              <span>
                {topic.imagesCount} {topic.imagesCount === 1 ? "page" : "pages"}
              </span>
            </span>
          )}
        </div>

        <Link
          href={`/resources/${topic._id}`}
          className="wr-card-view-link"
          title="Open and study resource topic"
        >
          <span>View</span>
          <ExternalLinkIcon ref={extRef} size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function WorkspaceResources({ loggedIn }) {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const folderIconRef = useRef(null);
  const plusIconRef = useRef(null);
  const lockEmptyRef = useRef(null);
  const loginIconRef = useRef(null);
  const emptyFolderRef = useRef(null);
  const emptyPlusRef = useRef(null);
  const publicIconRef = useRef(null);
  const manageIconRef = useRef(null);

  const fetchLatestResources = useCallback(async () => {
    if (!loggedIn) {
      setTopics([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await authFetch("/api/user/resources?limit=3");
      if (res.ok) {
        const data = await res.json();
        setTopics(Array.isArray(data?.topics) ? data.topics.slice(0, 3) : []);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error("Failed to fetch latest resources:", err);
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  }, [loggedIn]);

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next && !hasFetched && loggedIn) {
        fetchLatestResources();
        setHasFetched(true);
      }
      return next;
    });
  };

  return (
    <section className="wr-section-wrapper" aria-label="Resources">
      {/* Main Apple Card Widget */}
      <div className="wr-widget-card">
        {/* Header Row - strictly 1 row on all devices */}
        <div className="wr-widget-header">
          <div
            className="wr-header-title-group"
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
              className="wr-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => folderIconRef.current?.startAnimation?.()}
              onMouseLeave={() => folderIconRef.current?.stopAnimation?.()}
            >
              <FolderIcon ref={folderIconRef} size={22} />
            </div>
            <div className="wr-title-text-group">
              <h3 className="wr-section-title">Resources</h3>
              <span className="wr-section-subtitle">Academic notes, study syllabus & materials</span>
            </div>
          </div>

          <div className="wr-header-actions">
            <Link
              href="/resources/upload"
              className="wr-add-resource-btn"
              onMouseEnter={() => plusIconRef.current?.startAnimation?.()}
              onMouseLeave={() => plusIconRef.current?.stopAnimation?.()}
              title="Upload new resources"
            >
              <PlusIcon ref={plusIconRef} size={16} />
              <span>Add Resources</span>
            </Link>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          <div className="wr-widget-body">
          {isLoading && (
            <div className="wr-skeleton-stack">
              <div className="wr-skeleton-card" />
              <div className="wr-skeleton-card" />
              <div className="wr-skeleton-card" />
            </div>
          )}

          {!isLoading && !loggedIn && (
            <div
              className="wr-empty-state wr-empty-guest"
              onMouseEnter={() => lockEmptyRef.current?.startAnimation?.()}
              onMouseLeave={() => lockEmptyRef.current?.stopAnimation?.()}
            >
              <div className="wr-empty-icon-wrap">
                <LockIcon ref={lockEmptyRef} size={22} />
              </div>
              <h4 className="wr-empty-title">Sign in to manage your resources</h4>
              <p className="wr-empty-desc">
                Organize your study notes, solutions, and academic topics into structured subjects.
              </p>
              <Link
                href="/login?redirect=/workspace"
                className="wr-empty-action-btn"
                onMouseEnter={() => loginIconRef.current?.startAnimation?.()}
                onMouseLeave={() => loginIconRef.current?.stopAnimation?.()}
              >
                <LogInIcon ref={loginIconRef} size={15} />
                <span>Sign In to Continue</span>
              </Link>
            </div>
          )}

          {!isLoading && loggedIn && topics.length === 0 && (
            <div
              className="wr-empty-state"
              onMouseEnter={() => emptyFolderRef.current?.startAnimation?.()}
              onMouseLeave={() => emptyFolderRef.current?.stopAnimation?.()}
            >
              <div className="wr-empty-icon-wrap">
                <FolderIcon ref={emptyFolderRef} size={22} />
              </div>
              <h4 className="wr-empty-title">No resources uploaded yet</h4>
              <p className="wr-empty-desc">
                Share your semester subjects, lecture notes, and diagrams to help fellow students learn.
              </p>
              <Link
                href="/resources/upload"
                className="wr-empty-action-btn"
                onMouseEnter={() => emptyPlusRef.current?.startAnimation?.()}
                onMouseLeave={() => emptyPlusRef.current?.stopAnimation?.()}
              >
                <PlusIcon ref={emptyPlusRef} size={16} />
                <span>Upload Your First Resource</span>
              </Link>
            </div>
          )}

          {!isLoading && loggedIn && topics.length > 0 && (
            <div className="wr-cards-list">
              {topics.map((t) => (
                <ResourceTopicCard key={t._id} topic={t} />
              ))}
            </div>
          )}
        </div>
      )}

        {/* Footer Navigation Buttons: Public Resources & Manage Resources - strictly 1 row */}
        <div className="wr-widget-footer">
          <Link
            href="/resources"
            className="wr-footer-btn wr-btn-public"
            onMouseEnter={() => publicIconRef.current?.startAnimation?.()}
            onMouseLeave={() => publicIconRef.current?.stopAnimation?.()}
            title="Explore all public academic resources"
          >
            <GlobeIcon ref={publicIconRef} size={16} />
            <span>Public Resources</span>
          </Link>

          <Link
            href="/resources/upload"
            className="wr-footer-btn wr-btn-manage"
            onMouseEnter={() => manageIconRef.current?.startAnimation?.()}
            onMouseLeave={() => manageIconRef.current?.stopAnimation?.()}
            title="Manage and upload your subjects and resources"
          >
            <span>Manage Resources</span>
            <ArrowRightIcon ref={manageIconRef} size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
