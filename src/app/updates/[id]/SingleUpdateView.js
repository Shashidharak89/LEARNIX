"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiClock,
  FiUser,
  FiEye,
  FiDownload,
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
  FiLock,
} from "react-icons/fi";
import { Share2 } from "lucide-react";
import { authFetch } from "@/lib/clientAuth";
import { groupConsecutiveLinks } from "../../utils/youtube";
import LinkPreview from "../../components/LinkPreview";
import YouTubeEmbed from "../../components/YouTubeEmbed";
import FileIcon from "../../components/FileIcon";
import ExpandableDescription from "../../components/ExpandableDescription";
import "../styles/Updates.css";
import "./styles/SingleUpdateView.css";

const DEFAULT_PROFILE_IMAGE =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export default function SingleUpdateView({ updateId }) {
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

  const formatExactTimestamp = (iso) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;

      const day = date.getDate();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;

      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
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

  // Skeleton Loader (Without navigation header bar)
  if (loading) {
    return (
      <div className="suv-container">
        <main className="suv-main">
          <div className="upd-card suv-card" style={{ opacity: 0.75 }}>
            <div className="upd-card-header">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#e2e8f0",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: 140,
                    height: 16,
                    background: "#cbd5e1",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    width: 90,
                    height: 12,
                    background: "#e2e8f0",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                width: "70%",
                height: 22,
                background: "#cbd5e1",
                borderRadius: 6,
                margin: "16px 0 12px",
              }}
            />
            <div
              style={{
                width: "100%",
                height: 14,
                background: "#e2e8f0",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: "85%",
                height: 14,
                background: "#e2e8f0",
                borderRadius: 4,
                marginBottom: 20,
              }}
            />
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

  const profileLink = update.usn ? `/users/${encodeURIComponent(update.usn)}` : "/profile";

  return (
    <div className="suv-container">
      <main className="suv-main">
        {/* Main Update Card styled exactly like the Updates page card */}
        <div className="upd-card suv-card">
          {/* Card Header */}
          <div className="upd-card-header">
            <Link href={profileLink}>
              <img
                src={update.profileUrl || DEFAULT_PROFILE_IMAGE}
                alt={update.name || "user"}
                className="upd-avatar"
                onError={(e) => {
                  e.target.src = DEFAULT_PROFILE_IMAGE;
                }}
              />
            </Link>
            <div className="upd-user-info">
              <div className="upd-user-top-row">
                <div
                  className="upd-user-name-usn"
                  title={`${update.name || ""}${update.usn ? ` • ${update.usn}` : ""}`}
                >
                  <Link href={profileLink} className="upd-user-name-link">
                    <FiUser className="upd-user-icon" />
                    <span className="upd-user-name-text">{update.name || "User"}</span>
                  </Link>
                  {update.usn && (
                    <Link
                      href={`/users/${encodeURIComponent(update.usn)}`}
                      className="upd-usn-link"
                    >
                      • {update.usn}
                    </Link>
                  )}
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
                <button
                  type="button"
                  className="upd-share-btn"
                  title="Share update"
                  aria-label="Share update"
                  onClick={handleShare}
                >
                  <Share2 size={15} />
                </button>
              </div>

              <div className="upd-user-sub-row">
                {update.title && (
                  <div className="upd-user-title">
                    <span>{update.title}</span>
                  </div>
                )}
                <div className="upd-timestamp">
                  <FiClock className="upd-time-icon" />
                  <span>{formatExactTimestamp(update.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description with "Read More" button if it has plenty of description */}
          <ExpandableDescription content={update.content} className="upd-content" />

          {/* Embedded YouTube / Links */}
          {update.links && update.links.length > 0 && (
            <div className="upd-links">
              {groupConsecutiveLinks(update.links).map((group, groupIdx) => {
                if (group.type === "youtube-group") {
                  if (group.items.length === 2) {
                    return (
                      <div key={groupIdx} className="upd-youtube-grid-2">
                        {group.items.map((item, itemIdx) => (
                          <YouTubeEmbed
                            key={itemIdx}
                            ytId={item.ytId}
                            wrapperClass="upd-youtube-embed-wrapper upd-youtube-grid-item"
                            iframeClass="upd-youtube-iframe"
                          />
                        ))}
                      </div>
                    );
                  }
                  const item = group.items[0];
                  return (
                    <YouTubeEmbed
                      key={groupIdx}
                      ytId={item.ytId}
                      wrapperClass="upd-youtube-embed-wrapper"
                      iframeClass="upd-youtube-iframe"
                    />
                  );
                }

                if (group.type === "internal") {
                  return (
                    <Link key={groupIdx} href={group.raw} className="upd-link upd-link-internal">
                      <span>Visit</span>
                      <FiChevronRight className="upd-link-icon" />
                    </Link>
                  );
                }

                return <LinkPreview key={groupIdx} url={group.raw} />;
              })}
            </div>
          )}

          {/* Files section — identical organization, layout, and styling as Updates page */}
          {update.files && update.files.length > 0 && (
            <div className="upd-files">
              <div className="upd-files-label">Attachments</div>
              {update.files.map((fileItem, index) => {
                const url = fileItem.url || fileItem;
                const name =
                  fileItem.name ||
                  (typeof url === "string" ? url.split("/").pop() : "Attachment");
                const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                  url
                )}`;

                // If Cloudinary PDF, transform link for direct download
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
                        title="View"
                      >
                        <FiEye />
                      </a>
                      <a
                        href={downloadUrl}
                        download={isPdf ? undefined : name}
                        target={isPdf ? undefined : "_blank"}
                        rel="noreferrer noopener"
                        className="upd-file-action-btn upd-file-action-download"
                        title="Download"
                      >
                        <FiDownload />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
