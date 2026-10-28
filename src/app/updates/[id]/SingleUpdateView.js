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
  FiZap,
  FiFolder,
  FiBell,
  FiBookOpen,
  FiFileText,
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

function normalizeResourceType(type, sourceFile) {
  const t = (type || "").toLowerCase().trim();
  const s = (sourceFile || "").toLowerCase().trim();

  if (
    t === "topic" ||
    t === "topics" ||
    t === "work" ||
    t === "works" ||
    t === "resource" ||
    t === "resources" ||
    s === "resources"
  ) {
    return "resource";
  }

  if (t === "update" || t === "updates" || s === "updates") {
    return "update";
  }

  if (t === "study_material" || t === "materials" || t === "material" || s === "study_materials") {
    return "study_material";
  }

  if (t === "question_paper" || t === "qp" || t === "questionpapers") {
    return "question_paper";
  }

  return t || "resource";
}

const TYPE_CONFIG = {
  resource: {
    label: "Resource",
    icon: FiFolder,
    badgeClass: "suv-ai-pill--resource",
  },
  update: {
    label: "Update",
    icon: FiBell,
    badgeClass: "suv-ai-pill--update",
  },
  study_material: {
    label: "Study Material",
    icon: FiBookOpen,
    badgeClass: "suv-ai-pill--study",
  },
  question_paper: {
    label: "Question Paper",
    icon: FiFileText,
    badgeClass: "suv-ai-pill--qp",
  },
};

function getRecItemHref(item) {
  const normType = normalizeResourceType(item.resource_type, item.source_file);
  const cleanId = item.resource_id ? String(item.resource_id).replace(/^["']|["']$/g, "").trim() : "";

  if (normType === "resource") {
    if (cleanId) {
      if (cleanId.startsWith("sub-only-")) {
        return `/works/subject/${cleanId.replace("sub-only-", "")}`;
      }
      return `/works/${cleanId}`;
    }
    return item.resource_url || "/works";
  }

  if (normType === "update") {
    return cleanId ? `/updates/${cleanId}` : item.resource_url || "/updates";
  }

  if (normType === "study_material") {
    if (item.resource_url) return item.resource_url;
    return item.subject_name ? `/materials?q=${encodeURIComponent(item.subject_name)}` : "/materials";
  }

  if (normType === "question_paper") {
    return cleanId ? `/qp/${cleanId}` : "/qp";
  }

  return item.resource_url || (cleanId ? `/works/${cleanId}` : "/works");
}

export default function SingleUpdateView({ updateId }) {
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // 403, 404, 500
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // AI recommendations state
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [downloadingRecId, setDownloadingRecId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Automatically fetch recommendations when update loads, combining title and description
  useEffect(() => {
    if (!update) return;

    const combinedQuery = [update.title, update.content].filter(Boolean).join(" ").trim();
    if (!combinedQuery) return;

    setLoadingRecs(true);
    fetch("/api/ai-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: combinedQuery.slice(0, 300), limit: 5 }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Recommendation fetch failed");
        const data = await res.json();
        const currentId = String(updateId).replace(/^["']|["']$/g, "").trim();
        const filtered = (data.results || []).filter((item) => {
          const itemCleanId = item.resource_id
            ? String(item.resource_id).replace(/^["']|["']$/g, "").trim()
            : "";
          return itemCleanId !== currentId;
        });
        setRecommendations(filtered.slice(0, 3));
      })
      .catch((err) => {
        console.error("AI recommendations error:", err);
        setRecommendations([]);
      })
      .finally(() => {
        setLoadingRecs(false);
      });
  }, [update, updateId]);

  // View study material in Google Docs viewer in a new tab
  const handleRecViewMaterial = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const rawUrl = item.resource_url;
    if (rawUrl) {
      const googleViewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(rawUrl)}`;
      window.open(googleViewUrl, "_blank", "noopener,noreferrer");
    } else {
      const href = getRecItemHref(item);
      if (href) {
        const targetUrl =
          href.startsWith("http://") || href.startsWith("https://")
            ? href
            : `${typeof window !== "undefined" ? window.location.origin : ""}${href}`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  // Download study material file directly
  const handleRecDownloadMaterial = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const url = item.resource_url;
    if (!url) {
      handleRecViewMaterial(e, item);
      return;
    }

    const downloadKey = item.resource_id || url;
    setDownloadingRecId(downloadKey);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download request failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanTitle = (item.title || "study-material").trim();
      a.download = cleanTitle.toLowerCase().endsWith(".pdf") ? cleanTitle : `${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.warn("Direct blob download failed, opening in new tab:", err);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingRecId(null);
    }
  };

  // Clicking any recommendation card opens in a new tab
  const handleRecCardClick = (e, item) => {
    if (
      e.target.closest("button.suv-ai-btn--download") ||
      e.target.closest("button.suv-ai-btn--view")
    ) {
      return;
    }

    const normType = normalizeResourceType(item.resource_type, item.source_file);
    if (normType === "study_material" && item.resource_url) {
      const googleViewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(item.resource_url)}`;
      window.open(googleViewUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const href = getRecItemHref(item);
    if (href) {
      const targetUrl =
        href.startsWith("http://") || href.startsWith("https://")
          ? href
          : `${typeof window !== "undefined" ? window.location.origin : ""}${href}`;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
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
                <div className="upd-user-meta-right">
                  <span className="upd-views-badge" title={`${update.views ?? 0} views`}>
                    <FiEye className="upd-views-icon" />
                    <span>{update.views ?? 0}</span>
                  </span>
                  <div className="upd-timestamp">
                    <FiClock className="upd-time-icon" />
                    <span>{formatExactTimestamp(update.createdAt)}</span>
                  </div>
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

        {/* Separate AI Recommendations Card */}
        {(loadingRecs || (recommendations && recommendations.length > 0)) && (
          <div className="suv-ai-rec-card">
            <div className="suv-ai-rec-header">
              <div className="suv-ai-rec-badge-row">
                <span className="suv-ai-badge">
                  <FiZap size={13} className="suv-ai-sparkle-icon" />
                  <span>AI Suggestions</span>
                </span>
                <span className="suv-ai-count-tag">
                  {recommendations ? `${recommendations.length} recommended` : "Finding reads..."}
                </span>
              </div>
              <h3 className="suv-ai-rec-heading">Recommended to Read Next</h3>
              <p className="suv-ai-rec-sub">
                Curated resources, materials & related updates based on this topic
              </p>
            </div>

            {loadingRecs ? (
              <div className="suv-ai-skeleton-list">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="suv-ai-skeleton-card">
                    <div className="suv-ai-skel-line suv-ai-skel-pill" />
                    <div className="suv-ai-skel-line suv-ai-skel-title" />
                    <div className="suv-ai-skel-line suv-ai-skel-meta" />
                  </div>
                ))}
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="suv-ai-cards-list">
                {recommendations.map((item, idx) => {
                  const normType = normalizeResourceType(item.resource_type, item.source_file);
                  const config = TYPE_CONFIG[normType] || TYPE_CONFIG.resource;
                  const Icon = config.icon;
                  const isStudyMaterial = normType === "study_material";
                  const hasUrl = !!item.resource_url;

                  return (
                    <div
                      key={item.resource_id || `rec-${idx}`}
                      className="suv-ai-card"
                      onClick={(e) => handleRecCardClick(e, item)}
                      role="button"
                      tabIndex={0}
                      title="Click to open in new tab"
                      onKeyDown={(e) => e.key === "Enter" && handleRecCardClick(e, item)}
                    >
                      <div className="suv-ai-card-main">
                        <div className="suv-ai-card-meta-top">
                          <span className={`suv-ai-type-pill ${config.badgeClass}`}>
                            <Icon size={12} />
                            <span>{config.label}</span>
                          </span>
                          {item.similarity && (
                            <span className="suv-ai-similarity-badge">
                              {Math.round(item.similarity * 100)}% match
                            </span>
                          )}
                        </div>

                        <div className="suv-ai-card-title">{item.title}</div>

                        {(item.subject_name || item.course_name || item.semester_number) && (
                          <div className="suv-ai-card-details">
                            {item.subject_name && (
                              <span className="suv-ai-card-subject">{item.subject_name}</span>
                            )}
                            {item.semester_number && (
                              <span className="suv-ai-card-sem">Sem {item.semester_number}</span>
                            )}
                            {item.course_name && (
                              <span className="suv-ai-card-course">{item.course_name}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="suv-ai-card-actions">
                        {isStudyMaterial && hasUrl ? (
                          <div className="suv-ai-actions-group">
                            <button
                              type="button"
                              className="suv-ai-btn suv-ai-btn--view"
                              onClick={(e) => handleRecViewMaterial(e, item)}
                              title="View in Google Docs viewer"
                            >
                              <FiEye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              className="suv-ai-btn suv-ai-btn--download"
                              onClick={(e) => handleRecDownloadMaterial(e, item)}
                              disabled={
                                downloadingRecId === (item.resource_id || item.resource_url)
                              }
                              title="Download file directly"
                            >
                              <FiDownload size={12} />
                              <span>
                                {downloadingRecId === (item.resource_id || item.resource_url)
                                  ? "..."
                                  : "Download"}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="suv-ai-card-arrow" title="Open in new tab">
                            <FiChevronRight size={18} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
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
