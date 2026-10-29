"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  BellIcon,
  PlusIcon,
  GlobeIcon,
  LockIcon,
  LinkIcon,
  ClockIcon,
  FileTextIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  LogInIcon,
} from "@animateicons/react/lucide";
import { FiX, FiCheckCircle } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import AddUpdateForm from "../upload/updates/AddUpdateForm";
import "./styles/WorkspaceUpdates.css";

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
        className="wu-vis-pill wu-vis-private"
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
        className="wu-vis-pill wu-vis-unlisted"
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
      className="wu-vis-pill wu-vis-public"
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <GlobeIcon ref={iconRef} size={12} />
      <span>Public</span>
    </span>
  );
}

function UpdateCardItem({ update }) {
  const clockRef = useRef(null);
  const extRef = useRef(null);
  const fileRef = useRef(null);
  const linkRef = useRef(null);

  return (
    <div
      className="wu-update-card"
      onMouseEnter={() => {
        clockRef.current?.startAnimation?.();
        extRef.current?.startAnimation?.();
      }}
      onMouseLeave={() => {
        clockRef.current?.stopAnimation?.();
        extRef.current?.stopAnimation?.();
      }}
    >
      <div className="wu-card-header">
        <h4 className="wu-card-title">
          <Link href={`/updates/${update._id}`} className="wu-title-link">
            {update.title || "Update"}
          </Link>
        </h4>
        <VisibilityBadge visibility={update.visibility} />
      </div>

      {update.content && <p className="wu-card-desc">{update.content}</p>}

      <div className="wu-card-meta">
        <span className="wu-meta-time">
          <ClockIcon ref={clockRef} size={13} />
          <span>{formatTimeAgo(update.createdAt)}</span>
        </span>

        {Array.isArray(update.files) && update.files.length > 0 && (
          <span
            className="wu-meta-pill"
            onMouseEnter={() => fileRef.current?.startAnimation?.()}
            onMouseLeave={() => fileRef.current?.stopAnimation?.()}
          >
            <FileTextIcon ref={fileRef} size={13} />
            <span>
              {update.files.length} {update.files.length === 1 ? "file" : "files"}
            </span>
          </span>
        )}

        {Array.isArray(update.links) && update.links.length > 0 && (
          <span
            className="wu-meta-pill"
            onMouseEnter={() => linkRef.current?.startAnimation?.()}
            onMouseLeave={() => linkRef.current?.stopAnimation?.()}
          >
            <LinkIcon ref={linkRef} size={13} />
            <span>
              {update.links.length} {update.links.length === 1 ? "link" : "links"}
            </span>
          </span>
        )}

        <Link
          href={`/updates/${update._id}`}
          className="wu-card-view-link"
          title="View update details"
        >
          <span>View</span>
          <ExternalLinkIcon ref={extRef} size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function WorkspaceUpdates({ loggedIn }) {
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [mounted, setMounted] = useState(false);

  const bellIconRef = useRef(null);
  const plusIconRef = useRef(null);
  const lockEmptyRef = useRef(null);
  const loginIconRef = useRef(null);
  const emptyBellRef = useRef(null);
  const emptyPlusRef = useRef(null);
  const publicIconRef = useRef(null);
  const manageIconRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLatestUpdates = useCallback(async () => {
    if (!loggedIn) {
      setUpdates([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await authFetch("/api/user/updates?limit=3");
      if (res.ok) {
        const data = await res.json();
        setUpdates(Array.isArray(data?.updates) ? data.updates.slice(0, 3) : []);
      } else {
        setUpdates([]);
      }
    } catch (err) {
      console.error("Failed to fetch latest updates:", err);
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    fetchLatestUpdates();
  }, [fetchLatestUpdates]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleOpenModal = () => {
    if (!loggedIn) {
      window.location.href = "/login?redirect=/workspace";
      return;
    }
    setIsModalOpen(true);
  };

  const handleUpdateAdded = () => {
    setIsModalOpen(false);
    setToastMessage("Update posted successfully!");
    setTimeout(() => setToastMessage(null), 3500);
    fetchLatestUpdates();
  };

  return (
    <section className="wu-section-wrapper" aria-label="Updates">
      {/* Toast Notification (Portaled to body) */}
      {mounted && toastMessage && createPortal(
        <div className="wu-toast-notification" role="status">
          <FiCheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}

      {/* Main Apple Card Widget */}
      <div className="wu-widget-card">
        {/* Header Row */}
        <div className="wu-widget-header">
          <div className="wu-header-title-group">
            <div
              className="wu-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => bellIconRef.current?.startAnimation?.()}
              onMouseLeave={() => bellIconRef.current?.stopAnimation?.()}
            >
              <BellIcon ref={bellIconRef} size={22} />
            </div>
            <div className="wu-title-text-group">
              <div className="wu-badge-row">
                <span className="wu-header-tag">UPDATES</span>
                {loggedIn && updates.length > 0 && (
                  <span className="wu-count-pill">{updates.length} Latest</span>
                )}
              </div>
              <h3 className="wu-section-title">Updates</h3>
            </div>
          </div>

          <div className="wu-header-actions">
            <button
              type="button"
              className="wu-add-update-btn"
              onClick={handleOpenModal}
              onMouseEnter={() => plusIconRef.current?.startAnimation?.()}
              onMouseLeave={() => plusIconRef.current?.stopAnimation?.()}
              title="Post a new update"
            >
              <PlusIcon ref={plusIconRef} size={16} />
              <span>Add Update</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="wu-widget-body">
          {isLoading && (
            <div className="wu-skeleton-stack">
              <div className="wu-skeleton-card" />
              <div className="wu-skeleton-card" />
              <div className="wu-skeleton-card" />
            </div>
          )}

          {!isLoading && !loggedIn && (
            <div
              className="wu-empty-state wu-empty-guest"
              onMouseEnter={() => lockEmptyRef.current?.startAnimation?.()}
              onMouseLeave={() => lockEmptyRef.current?.stopAnimation?.()}
            >
              <div className="wu-empty-icon-wrap">
                <LockIcon ref={lockEmptyRef} size={22} />
              </div>
              <h4 className="wu-empty-title">Sign in to manage your updates</h4>
              <p className="wu-empty-desc">
                Post announcements, study materials, and assignments to your fellow students.
              </p>
              <Link
                href="/login?redirect=/workspace"
                className="wu-empty-action-btn"
                onMouseEnter={() => loginIconRef.current?.startAnimation?.()}
                onMouseLeave={() => loginIconRef.current?.stopAnimation?.()}
              >
                <LogInIcon ref={loginIconRef} size={15} />
                <span>Sign In to Continue</span>
              </Link>
            </div>
          )}

          {!isLoading && loggedIn && updates.length === 0 && (
            <div
              className="wu-empty-state"
              onMouseEnter={() => emptyBellRef.current?.startAnimation?.()}
              onMouseLeave={() => emptyBellRef.current?.stopAnimation?.()}
            >
              <div className="wu-empty-icon-wrap">
                <BellIcon ref={emptyBellRef} size={22} />
              </div>
              <h4 className="wu-empty-title">No updates posted yet</h4>
              <p className="wu-empty-desc">
                Keep fellow learners informed with syllabus changes, notes, or announcements.
              </p>
              <button
                type="button"
                className="wu-empty-action-btn"
                onClick={handleOpenModal}
                onMouseEnter={() => emptyPlusRef.current?.startAnimation?.()}
                onMouseLeave={() => emptyPlusRef.current?.stopAnimation?.()}
              >
                <PlusIcon ref={emptyPlusRef} size={16} />
                <span>Post Your First Update</span>
              </button>
            </div>
          )}

          {!isLoading && loggedIn && updates.length > 0 && (
            <div className="wu-cards-list">
              {updates.map((u) => (
                <UpdateCardItem key={u._id} update={u} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons: Public Updates & Manage Updates */}
        <div className="wu-widget-footer">
          <Link
            href="/updates"
            className="wu-footer-btn wu-btn-public"
            onMouseEnter={() => publicIconRef.current?.startAnimation?.()}
            onMouseLeave={() => publicIconRef.current?.stopAnimation?.()}
            title="Browse all public updates"
          >
            <GlobeIcon ref={publicIconRef} size={16} />
            <span>Public Updates</span>
          </Link>

          <Link
            href="/upload/updates"
            className="wu-footer-btn wu-btn-manage"
            onMouseEnter={() => manageIconRef.current?.startAnimation?.()}
            onMouseLeave={() => manageIconRef.current?.stopAnimation?.()}
            title="Manage all your updates"
          >
            <span>Manage Updates</span>
            <ArrowRightIcon ref={manageIconRef} size={16} />
          </Link>
        </div>
      </div>

      {/* Add Update Popup Window Modal (Portaled directly to document.body for full-screen takeover & blur) */}
      {mounted && isModalOpen && createPortal(
        <div
          className="wu-modal-overlay"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wu-modal-title"
        >
          <div
            className="wu-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wu-modal-header">
              <div className="wu-modal-header-left">
                <span className="wu-modal-tag">POST UPDATE</span>
                <h3 id="wu-modal-title" className="wu-modal-title">
                  New Update
                </h3>
              </div>
              <button
                type="button"
                className="wu-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="wu-modal-body">
              <AddUpdateForm
                onUpdateAdded={handleUpdateAdded}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
