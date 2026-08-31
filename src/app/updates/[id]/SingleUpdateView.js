"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiClock,
  FiUser,
  FiShare2,
  FiLock,
  FiEye,
  FiDownload,
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
} from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import { getYouTubeVideoId } from "../../utils/youtube";
import LinkPreview from "../../components/LinkPreview";
import FileIcon from "../../components/FileIcon";
import "./styles/SingleUpdateView.css";

const DEFAULT_PROFILE_IMAGE =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export default function SingleUpdateView({ updateId }) {
  const router = useRouter();
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // 403, 404, 500
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  useEffect(() => {
    if (!updateId) return;

    const fetchSingleUpdate = async () => {
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage("");

      try {
        const res = await authFetch(`/api/updates/${updateId}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorStatus(res.status);
          setErrorMessage(data.error || "Failed to load update");
          setLoading(false);
          return;
        }

        if (data.success && data.update) {
          setUpdate(data.update);
        } else {
          setErrorStatus(404);
          setErrorMessage("Update not found");
        }
      } catch (err) {
        console.error("Fetch single update error:", err);
        setErrorStatus(500);
        setErrorMessage("Something went wrong while fetching this update.");
      } finally {
        setLoading(false);
      }
    };

    fetchSingleUpdate();
  }, [updateId]);

  const formatRelativeTime = (iso) => {
    try {
      const then = new Date(iso);
      const now = new Date();
      const diffSec = Math.floor((now - then) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      return then.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const handleShare = (e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/updates/${updateId}`;

    if (navigator.share) {
      navigator
        .share({
          title: update?.title || "Check this update",
          text: `Check out this update on Learnix`,
          url: shareUrl,
        })
        .then(() => showToast("Shared successfully!"))
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => showToast("Link copied to clipboard!"))
        .catch(() => showToast("Failed to copy link"));
    }
  };

  // Skeleton Loader
  if (loading) {
    return (
      <div className="suv-container">
        <main className="suv-main">
          <div className="suv-header-bar">
            <div style={{ width: 140, height: 36, background: "#e2e8f0", borderRadius: 8 }} />
          </div>
          <div className="suv-card" style={{ opacity: 0.7 }}>
            <div className="suv-author-section">
              <div className="suv-author-info">
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#cbd5e1" }} />
                <div className="suv-author-details">
                  <div style={{ width: 140, height: 18, background: "#cbd5e1", borderRadius: 4 }} />
                  <div style={{ width: 90, height: 14, background: "#e2e8f0", borderRadius: 4, marginTop: 4 }} />
                </div>
              </div>
            </div>
            <div style={{ width: "70%", height: 26, background: "#cbd5e1", borderRadius: 6, marginBottom: 16 }} />
            <div style={{ width: "100%", height: 16, background: "#e2e8f0", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: "85%", height: 16, background: "#e2e8f0", borderRadius: 4, marginBottom: 24 }} />
          </div>
        </main>
      </div>
    );
  }

  // Permission Error (403 - Private update)
  if (errorStatus === 403) {
    return (
      <div className="suv-container">
        <main className="suv-main">
          <div className="suv-header-bar">
            <Link href="/updates" className="suv-back-btn">
              <FiArrowLeft /> Back to Updates
            </Link>
          </div>
          <div className="suv-state-card">
            <div className="suv-state-icon-box private">
              <FiLock size={36} />
            </div>
            <h2 className="suv-state-title">Private Update</h2>
            <p className="suv-state-desc">
              {errorMessage || "This update is private and can only be viewed by its author."}
            </p>
            <div className="suv-state-actions">
              <Link href="/updates" className="suv-action-btn-primary">
                Explore All Updates
              </Link>
              <Link href="/login" className="suv-action-btn-secondary">
                Login / Switch Account
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not Found or General Error (404/500)
  if (errorStatus || !update) {
    return (
      <div className="suv-container">
        <main className="suv-main">
          <div className="suv-header-bar">
            <Link href="/updates" className="suv-back-btn">
              <FiArrowLeft /> Back to Updates
            </Link>
          </div>
          <div className="suv-state-card">
            <div className="suv-state-icon-box notfound">
              <FiAlertCircle size={36} />
            </div>
            <h2 className="suv-state-title">Update Not Found</h2>
            <p className="suv-state-desc">
              {errorMessage || "The requested update could not be found or has been removed."}
            </p>
            <div className="suv-state-actions">
              <Link href="/updates" className="suv-action-btn-primary">
                Explore Updates
              </Link>
              <Link href="/" className="suv-action-btn-secondary">
                Go to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const profileLink = update.usn ? `/search/${encodeURIComponent(update.usn)}` : "/profile";

  return (
    <div className="suv-container">
      <main className="suv-main">
        {/* Top Header & Breadcrumbs */}
        <div className="suv-header-bar">
          <Link href="/updates" className="suv-back-btn">
            <FiArrowLeft /> Back to Updates
          </Link>
          <div className="suv-breadcrumbs">
            <Link href="/" className="suv-breadcrumb-link">
              Home
            </Link>
            <span>/</span>
            <Link href="/updates" className="suv-breadcrumb-link">
              Updates
            </Link>
            <span>/</span>
            <span className="suv-breadcrumb-current">{update.title || "Update"}</span>
          </div>
        </div>

        {/* Update Card */}
        <div className="suv-card">
          {/* Author Section */}
          <div className="suv-author-section">
            <div className="suv-author-info">
              <Link href={profileLink} className="suv-author-avatar-link" title="View Profile">
                <img
                  src={update.profileUrl || DEFAULT_PROFILE_IMAGE}
                  alt={update.name || "Author"}
                  className="suv-author-avatar"
                  onError={(e) => {
                    e.target.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
              </Link>
              <div className="suv-author-details">
                <div className="suv-author-name-row">
                  <Link href={profileLink} className="suv-author-name">
                    {update.name || "User"}
                  </Link>
                  {update.usn && <span className="suv-usn-badge">• {update.usn}</span>}
                  {update.isOwner && <span className="suv-owner-pill">Your Update</span>}
                  {update.isOwner && update.visibility && (
                    <span
                      className="suv-visibility-pill"
                      style={{
                        background:
                          update.visibility === "private"
                            ? "#fef2f2"
                            : update.visibility === "unlisted"
                            ? "#fffbe6"
                            : "#eff6ff",
                        color:
                          update.visibility === "private"
                            ? "#ef4444"
                            : update.visibility === "unlisted"
                            ? "#d97706"
                            : "#2563eb",
                        border: `1px solid ${
                          update.visibility === "private"
                            ? "#fecaca"
                            : update.visibility === "unlisted"
                            ? "#fef08a"
                            : "#bfdbfe"
                        }`,
                      }}
                    >
                      {update.visibility === "private"
                        ? "🔒 Private"
                        : update.visibility === "unlisted"
                        ? "🔗 Unlisted"
                        : "🌐 Public"}
                    </span>
                  )}
                </div>
                <div className="suv-time-meta">
                  <FiClock size={13} />
                  <span>{formatRelativeTime(update.createdAt)}</span>
                </div>
              </div>
            </div>

            <button type="button" className="suv-share-btn-top" onClick={handleShare}>
              <FiShare2 size={15} />
              <span>Share</span>
            </button>
          </div>

          {/* Title & Body Content */}
          <h1 className="suv-title">{update.title || "Update"}</h1>
          {update.content && <p className="suv-content-text">{update.content}</p>}

          {/* Embedded YouTube / Links */}
          {update.links && update.links.length > 0 && (
            <div className="suv-links-container">
              {update.links.map((linkUrl, index) => {
                const raw = String(linkUrl || "").trim();
                if (!raw) return null;

                const ytId = getYouTubeVideoId(raw);
                if (ytId) {
                  return (
                    <div key={index} className="suv-youtube-wrapper">
                      <iframe
                        className="suv-youtube-iframe"
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  );
                }

                if (raw.startsWith("/")) {
                  return (
                    <Link key={index} href={raw} className="suv-action-btn-secondary">
                      <span>Visit Link</span>
                      <FiChevronRight />
                    </Link>
                  );
                }

                return <LinkPreview key={index} url={raw} />;
              })}
            </div>
          )}

          {/* Attached Files */}
          {update.files && update.files.length > 0 && (
            <div className="suv-files-container">
              {update.files.map((fileItem, index) => {
                const url = fileItem.url || fileItem;
                const name = fileItem.name || url.split("/").pop();
                const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                  url
                )}`;

                let downloadUrl = url;
                const isPdf = typeof url === "string" && url.toLowerCase().endsWith(".pdf");
                if (isPdf && url.includes("res.cloudinary.com")) {
                  downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
                }

                return (
                  <div
                    key={index}
                    className="upd-file-card"
                    onClick={() => window.open(viewUrl, "_blank", "noopener,noreferrer")}
                  >
                    <div className="upd-file-card-name" title={`View ${name}`}>
                      <FileIcon filename={name || url} />
                      <span className="upd-file-card-label">{name}</span>
                    </div>
                    <div
                      className="upd-file-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="upd-file-action-btn upd-file-action-view"
                        title="View File"
                      >
                        <FiEye />
                      </a>
                      <a
                        href={downloadUrl}
                        download={isPdf ? undefined : name}
                        target={isPdf ? undefined : "_blank"}
                        rel="noreferrer noopener"
                        className="upd-file-action-btn upd-file-action-download"
                        title="Download File"
                      >
                        <FiDownload />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar */}
          <div className="suv-action-bar">
            <button type="button" className="suv-action-btn-primary" onClick={handleShare}>
              <FiShare2 size={16} /> Share Update
            </button>
            {update.usn && (
              <Link href={profileLink} className="suv-action-btn-secondary">
                <FiUser size={16} /> View Author Profile
              </Link>
            )}
            <Link href="/updates" className="suv-action-btn-secondary">
              Explore All Updates
            </Link>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="suv-toast">
          <FiCheck size={18} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
