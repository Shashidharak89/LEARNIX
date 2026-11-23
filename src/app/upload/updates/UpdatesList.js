"use client";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import {
  FiClock,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiAlertTriangle,
  FiTrash2,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiGlobe,
  FiLock,
  FiLink2,
  FiCheck
} from "react-icons/fi";
import {
  UserIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  ExternalLinkIcon,
  EyeIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
  SparklesIcon,
  FolderIcon,
  BellIcon,
  BookOpenIcon,
  FileTextIcon,
} from "@animateicons/react/lucide";
import { groupConsecutiveLinks } from '../../utils/youtube';
import LinkPreview from '../../components/LinkPreview';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import FileIcon from '../../components/FileIcon';
import { authFetch } from '@/lib/clientAuth';
import { isPdfFile, getPdfDownloadName, getPdfDownloadUrl, downloadPdfFile } from '@/lib/pdfDownload';
import ExpandableDescription from '../../components/ExpandableDescription';
import EditUpdateModal from './EditUpdateModal';
import '@/app/updates/styles/Updates.css';
import './styles/UpdatesList.css';

const FILES_LIMIT = 4;

function formatViews(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}k`;
  }
  return String(num);
}

function formatExactViews(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString()} view${num !== 1 ? 's' : ''}`;
}

function formatExactTimestamp(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return String(iso);
  }
}

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
    icon: FolderIcon,
    badgeClass: "suv-ai-pill--resource",
  },
  update: {
    label: "Update",
    icon: BellIcon,
    badgeClass: "suv-ai-pill--update",
  },
  study_material: {
    label: "Study Material",
    icon: BookOpenIcon,
    badgeClass: "suv-ai-pill--study",
  },
  question_paper: {
    label: "Question Paper",
    icon: FileTextIcon,
    badgeClass: "suv-ai-pill--qp",
  },
};

function getRecItemHref(item) {
  const normType = normalizeResourceType(item.resource_type, item.source_file);
  const cleanId = item.resource_id ? String(item.resource_id).replace(/^["']|["']$/g, "").trim() : "";

  if (normType === "resource") {
    if (cleanId) {
      if (cleanId.startsWith("sub-only-")) {
        return `/resources/subject/${cleanId.replace("sub-only-", "")}`;
      }
      return `/resources/${cleanId}`;
    }
    return item.resource_url || "/resources";
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

  return item.resource_url || (cleanId ? `/resources/${cleanId}` : "/resources");
}

// Single Update Card matching /updates exactly with direct edit button & quick visibility switcher
function MyUpdateCard({
  update: u,
  idx,
  currentUserId,
  currentUserUsn,
  openVisibilityMenuId,
  setOpenVisibilityMenuId,
  handleUpdateVisibility,
  onOpenEdit,
  onDeleteRequest,
  onShareUpdate,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // AI suggestions states
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [downloadingRecId, setDownloadingRecId] = useState(null);

  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const userIconRef = useRef(null);
  const timeIconRef = useRef(null);
  const viewsIconRef = useRef(null);
  const editBtnIconRef = useRef(null);
  const aiBtnIconRef = useRef(null);
  const shareRef = useRef(null);
  const externalLinkRef = useRef(null);

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(typeof window !== "undefined" && window.innerWidth >= 640);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  const fetchRecommendations = async () => {
    if (recommendations !== null || loadingRecs) return;
    setLoadingRecs(true);
    try {
      const combinedQuery = [u.title, u.content].filter(Boolean).join(" ").trim();
      if (!combinedQuery) {
        setRecommendations([]);
        return;
      }
      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: combinedQuery.slice(0, 300), limit: 5 }),
      });
      if (!res.ok) throw new Error("Recommendation fetch failed");
      const data = await res.json();
      const currentId = String(u._id).replace(/^["']|["']$/g, "").trim();
      const filtered = (data.results || []).filter((item) => {
        const itemCleanId = item.resource_id
          ? String(item.resource_id).replace(/^["']|["']$/g, "").trim()
          : "";
        return itemCleanId !== currentId;
      });
      setRecommendations(filtered.slice(0, 3));
    } catch (err) {
      console.error("AI recommendations error:", err);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleToggleAiSuggestions = () => {
    const nextState = !showAiSuggestions;
    setShowAiSuggestions(nextState);
    if (nextState && recommendations === null) {
      fetchRecommendations();
    }
  };

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
      const cleanTitle = (item.title || "study-material").trim();
      const actualName = cleanTitle.toLowerCase().endsWith(".pdf") ? cleanTitle : `${cleanTitle}.pdf`;
      await downloadPdfFile(url, actualName, cleanTitle);
    } catch (err) {
      console.warn("Direct blob download failed, opening in new tab:", err);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingRecId(null);
    }
  };

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

  const totalFiles = u.files?.length || 0;
  const hasMoreFiles = totalFiles > FILES_LIMIT;
  const visibleFiles = isFilesExpanded || !hasMoreFiles
    ? (u.files || [])
    : (u.files || []).slice(0, FILES_LIMIT);

  const totalLinks = u.links?.length || 0;
  const groups = groupConsecutiveLinks(u.links || []);
  const hasFirstRowYT = groups[0]?.type === 'youtube-group';

  let hasMoreLinks = false;
  let visibleGroups = groups;

  if (!isLinksExpanded && totalLinks > 0) {
    if (isLargeScreen) {
      if (groups[0]?.type === 'youtube-group' && groups[0]?.items?.length === 2) {
        if (groups.length > 1) {
          hasMoreLinks = true;
          visibleGroups = [groups[0]];
        }
      } else if (groups.length > 1 || (groups[0]?.items?.length || 1) > 1) {
        hasMoreLinks = true;
        visibleGroups = [groups[0]];
      }
    } else {
      if (groups[0]?.type === 'youtube-group') {
        if (groups[0]?.items?.length > 1 || groups.length > 1) {
          hasMoreLinks = true;
          visibleGroups = [{
            type: 'youtube-group',
            items: [groups[0].items[0]],
          }];
        }
      } else if (groups.length > 1) {
        hasMoreLinks = true;
        visibleGroups = [groups[0]];
      }
    }
  }

  const isOwner = Boolean(
    (currentUserId && u.userId && String(currentUserId) === String(u.userId)) ||
    (currentUserUsn && u.usn && currentUserUsn.toLowerCase() === u.usn.toLowerCase())
  );

  const isVisOpen = openVisibilityMenuId !== null && String(openVisibilityMenuId) === String(u._id);

  return (
    <article
      className={`upd-card ${isVisOpen ? 'upl-card-active-menu' : ''}`}
      style={{
        animationDelay: `${(idx % 10) * 25}ms`,
        position: 'relative',
        zIndex: isVisOpen ? 1000 : isMenuOpen ? 100 : 1,
      }}
    >
      <div className="upd-card-header">
        <Link href={`/users/${u.usn || ''}`}>
          <img
            src={u.profileUrl || '/default-profile.png'}
            alt={u.name || 'user'}
            className="upd-avatar"
          />
        </Link>
        <div className="upd-user-info">
          <div className="upd-user-top-row">
            <div className="upd-user-name-usn" title={`${u.name || ''}${u.usn ? ` • ${u.usn}` : ''}`}>
              <Link
                href={`/users/${u.usn || ''}`}
                className="upd-user-name-link"
                onMouseEnter={() => userIconRef.current?.startAnimation?.()}
                onMouseLeave={() => userIconRef.current?.stopAnimation?.()}
              >
                <UserIcon ref={userIconRef} className="upd-user-icon" size={14} />
                <span className="upd-user-name-text">{u.name || 'User'}</span>
              </Link>
              {u.usn && (
                <Link href={`/users/${u.usn}`} className="upd-usn-link">
                  • {u.usn}
                </Link>
              )}
            </div>

            <div className="upd-card-header-actions">
              {/* Views badge */}
              <div
                className="upd-header-views-badge"
                title={formatExactViews(u.views ?? 0)}
                onMouseEnter={() => viewsIconRef.current?.startAnimation?.()}
                onMouseLeave={() => viewsIconRef.current?.stopAnimation?.()}
              >
                <EyeIcon ref={viewsIconRef} className="upd-views-icon" size={14} />
                <span className="upd-views-count">{formatViews(u.views ?? 0)}</span>
              </div>

              {/* Direct Edit Button between views and 3 dots */}
              {isOwner && (
                <button
                  type="button"
                  className="upd-direct-edit-btn"
                  title="Edit update"
                  aria-label="Edit update"
                  onMouseEnter={() => editBtnIconRef.current?.startAnimation?.()}
                  onMouseLeave={() => editBtnIconRef.current?.stopAnimation?.()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEdit(u);
                  }}
                >
                  <PencilIcon ref={editBtnIconRef} size={15} />
                </button>
              )}

              {/* 3-dots more menu */}
              <div className="upd-more-menu-container" ref={menuRef}>
                <button
                  type="button"
                  className={`upd-more-btn ${isMenuOpen ? 'is-active' : ''}`}
                  title="More options"
                  aria-label="More options"
                  onMouseEnter={() => moreRef.current?.startAnimation?.()}
                  onMouseLeave={() => moreRef.current?.stopAnimation?.()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                >
                  <EllipsisVerticalIcon ref={moreRef} size={16} />
                </button>
                {isMenuOpen && (
                  <div className="upd-dropdown-menu">
                    <button
                      type="button"
                      className={`upd-dropdown-item ${showAiSuggestions ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        handleToggleAiSuggestions();
                      }}
                      onMouseEnter={() => aiBtnIconRef.current?.startAnimation?.()}
                      onMouseLeave={() => aiBtnIconRef.current?.stopAnimation?.()}
                    >
                      <SparklesIcon ref={aiBtnIconRef} size={14} style={{ color: '#a855f7' }} />
                      <span>{showAiSuggestions ? 'Hide AI suggestions' : 'AI suggestions'}</span>
                    </button>
                    <button
                      type="button"
                      className="upd-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onShareUpdate(u._id, u.title || 'Update');
                      }}
                      onMouseEnter={() => shareRef.current?.startAnimation?.()}
                      onMouseLeave={() => shareRef.current?.stopAnimation?.()}
                    >
                      <ShareIcon ref={shareRef} size={14} />
                      <span>Share update</span>
                    </button>
                    <button
                      type="button"
                      className="upd-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        window.open(`/updates/${u._id}`, "_blank", "noopener,noreferrer");
                      }}
                      onMouseEnter={() => externalLinkRef.current?.startAnimation?.()}
                      onMouseLeave={() => externalLinkRef.current?.stopAnimation?.()}
                    >
                      <ExternalLinkIcon ref={externalLinkRef} size={14} />
                      <span>Open in new tab</span>
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        className="upd-dropdown-item"
                        style={{ color: '#ef4444' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onDeleteRequest(String(u._id), u.title);
                        }}
                      >
                        <Trash2Icon size={14} />
                        <span>Delete update</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="upd-user-sub-row">
            {u.title && (
              <div className="upd-user-title">
                <Link
                  href={`/updates/${u._id}`}
                  className="upd-title-clickable-link"
                  title={`Open update: ${u.title}`}
                >
                  <span>{u.title}</span>
                </Link>
              </div>
            )}

            {/* Interactive Visibility Switcher with Apple-style dropdown */}
            <div className="upl-vis-container">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenVisibilityMenuId(isVisOpen ? null : String(u._id));
                }}
                className={`upl-vis-badge upl-vis-badge-${u.visibility || 'public'}`}
                title="Click to change visibility"
                aria-haspopup="true"
                aria-expanded={isVisOpen}
              >
                {u.visibility === 'private' ? (
                  <FiLock className="upl-vis-badge-icon" />
                ) : u.visibility === 'unlisted' ? (
                  <FiLink2 className="upl-vis-badge-icon" />
                ) : (
                  <FiGlobe className="upl-vis-badge-icon" />
                )}
                <span className="upl-vis-badge-text">
                  {u.visibility === 'private' ? 'Private' : u.visibility === 'unlisted' ? 'Unlisted' : 'Public'}
                </span>
                <FiChevronDown className={`upl-vis-badge-arrow ${isVisOpen ? 'upl-vis-badge-arrow-open' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isVisOpen && (
                <div className="upl-vis-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="upl-vis-dropdown-header">
                    <span>Change Visibility</span>
                  </div>
                  <div className="upl-vis-dropdown-list">
                    <button
                      type="button"
                      className={`upl-vis-dropdown-item ${(!u.visibility || u.visibility === 'public') ? 'active' : ''}`}
                      onClick={() => handleUpdateVisibility(u._id, 'public')}
                    >
                      <div className="upl-vis-item-icon-box upl-vis-icon-public">
                        <FiGlobe />
                      </div>
                      <div className="upl-vis-item-info">
                        <span className="upl-vis-item-title">Public</span>
                        <span className="upl-vis-item-desc">Visible to everyone on campus</span>
                      </div>
                      {(!u.visibility || u.visibility === 'public') && (
                        <FiCheck className="upl-vis-item-check" />
                      )}
                    </button>

                    <button
                      type="button"
                      className={`upl-vis-dropdown-item ${u.visibility === 'unlisted' ? 'active' : ''}`}
                      onClick={() => handleUpdateVisibility(u._id, 'unlisted')}
                    >
                      <div className="upl-vis-item-icon-box upl-vis-icon-unlisted">
                        <FiLink2 />
                      </div>
                      <div className="upl-vis-item-info">
                        <span className="upl-vis-item-title">Unlisted</span>
                        <span className="upl-vis-item-desc">Anyone with link can view</span>
                      </div>
                      {u.visibility === 'unlisted' && (
                        <FiCheck className="upl-vis-item-check" />
                      )}
                    </button>

                    <button
                      type="button"
                      className={`upl-vis-dropdown-item ${u.visibility === 'private' ? 'active' : ''}`}
                      onClick={() => handleUpdateVisibility(u._id, 'private')}
                    >
                      <div className="upl-vis-item-icon-box upl-vis-icon-private">
                        <FiLock />
                      </div>
                      <div className="upl-vis-item-info">
                        <span className="upl-vis-item-title">Private</span>
                        <span className="upl-vis-item-desc">Only visible to you</span>
                      </div>
                      {u.visibility === 'private' && (
                        <FiCheck className="upl-vis-item-check" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="upd-timestamp"
              onMouseEnter={() => timeIconRef.current?.startAnimation?.()}
              onMouseLeave={() => timeIconRef.current?.stopAnimation?.()}
            >
              <ClockIcon ref={timeIconRef} className="upd-time-icon" size={13} />
              <span>{formatExactTimestamp(u.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <ExpandableDescription content={u.content} className="upd-content" />

      {/* Links section */}
      {u.links && u.links.length > 0 && (
        <div className="upd-links-section">
          <div className={`upd-links-wrapper ${hasMoreLinks && !isLinksExpanded ? 'is-collapsed' : ''} ${hasFirstRowYT ? 'has-yt-video' : ''}`}>
            <div className="upd-links">
              {visibleGroups.map((group, groupIdx) => {
                if (group.type === 'youtube-group') {
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

                if (group.type === 'internal') {
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

            {hasMoreLinks && !isLinksExpanded && (
              <div className="upd-items-fade">
                <button
                  type="button"
                  className="upd-toggle-items-btn"
                  onClick={() => setIsLinksExpanded(true)}
                >
                  <span>View all links</span>
                  <FiChevronDown className="upd-toggle-items-btn-icon" />
                </button>
              </div>
            )}
          </div>

          {hasMoreLinks && isLinksExpanded && (
            <div className="upd-items-collapse-wrapper">
              <button
                type="button"
                className="upd-toggle-items-btn upd-toggle-items-btn-collapse"
                onClick={() => setIsLinksExpanded(false)}
              >
                <span>Show less links</span>
                <FiChevronUp className="upd-toggle-items-btn-icon" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Files section */}
      {u.files && u.files.length > 0 && (
        <div className="upd-files">
          <div className="upd-files-label">Attachments</div>
          <div className={`upd-files-wrapper ${hasMoreFiles && !isFilesExpanded ? 'is-collapsed' : ''}`}>
            <div className="upd-files-list">
              {visibleFiles.map((f, i) => {
                const url = f.url || f;
                const name = f.name || url.split('/').pop();
                const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

                let downloadUrl = url;
                const isPdf = isPdfFile(f, name);
                const actualPdfName = isPdf ? getPdfDownloadName(f, name, u?.title) : name;
                if (isPdf) {
                  downloadUrl = getPdfDownloadUrl(url, actualPdfName, u?.title);
                }

                return (
                  <div
                    key={i}
                    className="upd-file-card"
                    onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <div className="upd-file-card-name" title={`View ${name}`}>
                      <FileIcon filename={name || url} />
                      <span className="upd-file-card-label">{name}</span>
                    </div>
                    <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                      <a href={viewUrl} target="_blank" rel="noreferrer noopener" className="upd-file-action-btn upd-file-action-view" title="View">
                        <EyeIcon size={14} />
                      </a>
                      <a
                        href={downloadUrl}
                        download={isPdf ? actualPdfName : name}
                        target={isPdf ? undefined : "_blank"}
                        rel="noreferrer noopener"
                        className="upd-file-action-btn upd-file-action-download"
                        title={`Download ${isPdf ? actualPdfName : name}`}
                        onClick={isPdf ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          downloadPdfFile(url, actualPdfName, u?.title);
                        } : undefined}
                      >
                        <DownloadIcon size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMoreFiles && !isFilesExpanded && (
              <div className="upd-items-fade">
                <button
                  type="button"
                  className="upd-toggle-items-btn"
                  onClick={() => setIsFilesExpanded(true)}
                >
                  <span>View all attachments</span>
                  <FiChevronDown className="upd-toggle-items-btn-icon" />
                </button>
              </div>
            )}
          </div>

          {hasMoreFiles && isFilesExpanded && (
            <div className="upd-items-collapse-wrapper">
              <button
                type="button"
                className="upd-toggle-items-btn upd-toggle-items-btn-collapse"
                onClick={() => setIsFilesExpanded(false)}
              >
                <span>Show less attachments</span>
                <FiChevronUp className="upd-toggle-items-btn-icon" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline AI suggestions section */}
      {showAiSuggestions && (
        <div className="upd-ai-inline-section">
          <div className="upd-ai-inline-header">
            <div className="upd-ai-inline-title-wrap">
              <SparklesIcon size={14} className="upd-ai-inline-sparkle" />
              <span className="upd-ai-inline-title">AI suggestions on this update</span>
            </div>
            <span className="upd-ai-inline-count">
              {loadingRecs
                ? "Finding suggestions..."
                : recommendations && recommendations.length > 0
                ? `${recommendations.length} recommended`
                : "No suggestions"}
            </span>
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
                            <EyeIcon size={12} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="suv-ai-btn suv-ai-btn--download"
                            onClick={(e) => handleRecDownloadMaterial(e, item)}
                            disabled={downloadingRecId === (item.resource_id || item.resource_url)}
                            title="Download file directly"
                          >
                            <DownloadIcon size={12} />
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
          ) : (
            <div className="suv-ai-empty">
              No relevant resources found for this update.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function UpdatesList({ refreshKey, searchQuery = "", onClearSearch }) {
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserUsn, setCurrentUserUsn] = useState(null);
  const [toast, setToast] = useState(null);
  const pendingRef = useRef({});

  // Visibility dropdown state
  const [openVisibilityMenuId, setOpenVisibilityMenuId] = useState(null);

  // Modal states
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingUpdate, setEditingUpdate] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.upl-vis-container')) {
        setOpenVisibilityMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleUpdateVisibility = async (updateId, newVisibility) => {
    setOpenVisibilityMenuId(null);

    // Optimistic UI update
    setUpdates((prev) =>
      prev.map((u) => (String(u._id) === String(updateId) ? { ...u, visibility: newVisibility } : u))
    );

    try {
      const res = await authFetch('/api/updates/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, visibility: newVisibility })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update visibility');
      showToast(`Visibility updated to ${newVisibility}`, 'success');
    } catch (err) {
      console.error('Visibility update error:', err);
      showToast('Failed to change visibility', 'error');
      if (currentUserId) {
        fetchPage(page, false, currentUserId, searchQuery);
      }
    }
  };

  const fetchPage = async (p = 1, append = false, userId = currentUserId, query = searchQuery) => {
    if (!userId) {
      setUpdates([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const urlParams = new globalThis.URLSearchParams({
        index: String(p),
        limit: '10',
        userId: encodeURIComponent(userId)
      });
      if (query && query.trim()) {
        urlParams.set('q', query.trim());
      }
      const res = await authFetch(`/api/user/updates?${urlParams.toString()}`);
      if (!res.ok) throw new Error('Failed to load updates');
      const data = await res.json();
      const items = data?.updates || [];
      const paginationHasMore = data?.pagination?.hasMore !== undefined ? data.pagination.hasMore : items.length === 10;
      setHasMore(paginationHasMore);
      setUpdates(prev => (append ? [...prev, ...items] : items));
    } catch (err) {
      console.error(err);
      showToast('Failed to load updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const usn = typeof window !== 'undefined' ? localStorage.getItem('usn') : null;
    if (!usn) {
      setUpdates([]);
      setHasMore(false);
      return;
    }
    setCurrentUserUsn(usn);

    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const d = await res.json();
          if (d?.userId) {
            setCurrentUserId(d.userId);
            setPage(1);
            fetchPage(1, false, d.userId, searchQuery);
          }
        }
      } catch (e) {
        console.error('Failed to resolve current user id', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (refreshKey > 0 && currentUserId) {
      setPage(1);
      fetchPage(1, false, currentUserId, searchQuery);
    }
  }, [refreshKey]);

  useEffect(() => {
    if (currentUserId) {
      setPage(1);
      fetchPage(1, false, currentUserId, searchQuery);
    }
  }, [searchQuery]);

  const loadMore = () => {
    if (!currentUserId) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, true, currentUserId, searchQuery);
  };

  const toastTimeoutRef = useRef(null);
  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const openDeleteModal = (updateId, title) => {
    setDeleteModal({ updateId, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const updateId = deleteModal.updateId;
    closeDeleteModal();

    if (!currentUserId) {
      showToast('You must be signed in to delete', 'error');
      return;
    }

    const prev = updates;
    setUpdates(updates.filter(u => u._id !== updateId));
    pendingRef.current[updateId] = true;

    try {
      const res = await fetch('/api/updates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, userId: currentUserId }),
      });
      let data;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok) throw new Error(data?.error || `Delete failed (status ${res.status})`);
      showToast('Update deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error', err);
      showToast('Failed to delete update', 'error');
      setUpdates(prev);
    } finally {
      delete pendingRef.current[updateId];
    }
  };

  const handleShareUpdate = (updateId, updateTitle) => {
    const shareUrl = `${window.location.origin}/updates/${updateId}`;
    if (navigator.share) {
      navigator.share({
        title: updateTitle || 'Campus Update',
        text: `Check out this update: ${updateTitle}`,
        url: shareUrl,
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
          showToast('Link copied to clipboard!', 'success');
        }
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleUpdateSaved = (updatedItem) => {
    setUpdates((prev) =>
      prev.map((it) => (it._id === updatedItem._id ? { ...it, ...updatedItem } : it))
    );
    showToast('Update saved successfully', 'success');
  };

  const UpdateSkeleton = () => (
    <div className="upd-card upl-skeleton">
      <div className="upd-card-header">
        <div className="upl-skeleton-avatar"></div>
        <div className="upl-skeleton-text-group">
          <div className="upl-skeleton-line upl-skeleton-title"></div>
          <div className="upl-skeleton-line upl-skeleton-meta"></div>
        </div>
      </div>
      <div className="upl-skeleton-content">
        <div className="upl-skeleton-line upl-skeleton-text"></div>
        <div className="upl-skeleton-line upl-skeleton-text upl-skeleton-text-short"></div>
      </div>
    </div>
  );

  return (
    <section className="upl-container">
      <div className="upl-header-section">
        <div className="upl-header-icon"><FiClock /></div>
        <h4 className="upl-section-title">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Recent Updates"}
        </h4>
        {searchQuery && onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="upl-clear-search-badge"
            title="Clear search filter"
          >
            <span>Clear filter</span>
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Floating Screen-Bottom Toast Notification */}
      {toast && (
        <div className={`upl-toast upl-toast-${toast.type || 'info'}`} role="status" aria-live="polite">
          <div className="upl-toast-icon-box">
            {toast.type === 'success' ? (
              <FiCheckCircle className="upl-toast-icon" />
            ) : toast.type === 'error' ? (
              <FiAlertCircle className="upl-toast-icon" />
            ) : (
              <FiInfo className="upl-toast-icon" />
            )}
          </div>
          <span className="upl-toast-text">{toast.message}</span>
          <button
            type="button"
            className="upl-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="upl-modal-overlay" onClick={closeDeleteModal}>
          <div className="upl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upl-modal-header">
              <div className="upl-modal-header-left">
                <FiAlertTriangle className="upl-modal-icon upl-modal-icon-danger" />
                <h3 className="upl-modal-title">Delete Update</h3>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="upl-modal-close-btn"
                title="Close"
                aria-label="Close delete modal"
              >
                <FiX />
              </button>
            </div>
            <div className="upl-modal-body">
              <p className="upl-modal-text">Are you sure you want to delete <strong>"{deleteModal.title}"</strong>?</p>
              <p className="upl-modal-subtext">This action cannot be undone.</p>
            </div>
            <div className="upl-modal-actions">
              <button type="button" onClick={closeDeleteModal} className="upl-modal-btn upl-modal-btn-cancel">
                <FiX />
                <span>Cancel</span>
              </button>
              <button type="button" onClick={confirmDelete} className="upl-modal-btn upl-modal-btn-danger">
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple-styled Edit Update Modal */}
      {editingUpdate && (
        <EditUpdateModal
          update={editingUpdate}
          currentUserId={currentUserId}
          onClose={() => setEditingUpdate(null)}
          onUpdateSaved={handleUpdateSaved}
        />
      )}

      {/* Empty State */}
      {updates.length === 0 && !loading && (
        <div className="upl-empty-state">
          <FiClock className="upl-empty-icon" />
          <p className="upl-empty-text">
            {searchQuery
              ? `No updates found in your account matching "${searchQuery}".`
              : "No updates yet."}
          </p>
          {searchQuery && onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="upl-empty-clear-btn"
            >
              Show all updates
            </button>
          )}
        </div>
      )}

      {/* Skeleton */}
      {loading && page === 1 && (
        <div className="upl-list">
          <UpdateSkeleton /><UpdateSkeleton /><UpdateSkeleton />
        </div>
      )}

      {/* Updates List */}
      <div className="upl-list">
        {updates.map((u, idx) => (
          <MyUpdateCard
            key={u._id}
            update={u}
            idx={idx}
            currentUserId={currentUserId}
            currentUserUsn={currentUserUsn}
            openVisibilityMenuId={openVisibilityMenuId}
            setOpenVisibilityMenuId={setOpenVisibilityMenuId}
            handleUpdateVisibility={handleUpdateVisibility}
            onOpenEdit={(update) => setEditingUpdate(update)}
            onDeleteRequest={(id, title) => openDeleteModal(id, title)}
            onShareUpdate={handleShareUpdate}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="upl-load-more-section">
        {loading && page > 1 ? (
          <button className="upl-load-more-btn" disabled><span className="upl-spinner"></span><span>Loading...</span></button>
        ) : hasMore ? (
          <button onClick={loadMore} className="upl-load-more-btn"><span>Load More</span><FiChevronRight className="upl-btn-icon" /></button>
        ) : (
          updates.length > 0 && <div className="upl-end-message"><span>No more updates</span></div>
        )}
      </div>
    </section>
  );
}
