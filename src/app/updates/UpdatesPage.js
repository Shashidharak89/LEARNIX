"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import { FiChevronRight, FiChevronDown, FiChevronUp, FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import {
  BellIcon,
  BookmarkIcon,
  SearchIcon,
  PlusIcon,
  ListIcon,
  EyeIcon,
  DownloadIcon,
  ShareIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
  ExternalLinkIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  BookOpenIcon,
  FileTextIcon,
} from "@animateicons/react/lucide";
import AddUpdateForm from '../upload/updates/AddUpdateForm';
import { getYouTubeVideoId, groupConsecutiveLinks } from '../utils/youtube';
import LinkPreview from '../components/LinkPreview';
import YouTubeEmbed from '../components/YouTubeEmbed';
import FileIcon from '../components/FileIcon';
import ExpandableDescription from '../components/ExpandableDescription';
import { toggleLearnLaterClient } from '@/lib/clientLearnLater';
import './styles/Updates.css';

function useIsLargeScreen() {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 640px)');
    setIsLarge(media.matches);

    const handler = (e) => setIsLarge(e.matches);
    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } else if (media.addListener) {
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
  }, []);

  return isLarge;
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

function highlightText(text, searchQuery) {
  if (!text || !searchQuery || !searchQuery.trim()) return text;
  const words = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return text;
  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="upd-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function UpdateCard({
  u,
  isHighlighted,
  highlightedCardRef,
  isLargeScreen,
  handleShareUpdate,
  formatExactTimestamp,
  searchQuery = "",
}) {
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [downloadingRecId, setDownloadingRecId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSavedInLearnLater, setIsSavedInLearnLater] = useState(false);
  const menuRef = useRef(null);
  const userIconRef = useRef(null);
  const viewsIconRef = useRef(null);
  const aiBtnIconRef = useRef(null);
  const moreRef = useRef(null);
  const bookmarkRef = useRef(null);
  const shareRef = useRef(null);
  const externalLinkRef = useRef(null);
  const timeIconRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLearnLaterToggle = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const res = await toggleLearnLaterClient({
      type: "update",
      targetId: u._id,
      title: u.title || "Update",
      subtitle: u.name || (u.usn ? `By ${u.usn}` : "Learnix Update"),
      description: u.content || "",
      url: `/updates/${u._id}`,
      metadata: {
        usn: u.usn,
        userName: u.name,
      },
    });
    if (res && res.success !== false) {
      setIsSavedInLearnLater(res.isSaved);
    }
  };

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
  const FILES_LIMIT = 2;
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
      // Large screen: 2 YouTube videos can fit in 1 row (upd-youtube-grid-2).
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
      // Default / small screens: 1 video or 1 link fits cleanly.
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

  return (
    <div
      ref={isHighlighted ? highlightedCardRef : null}
      className={`upd-card ${isHighlighted ? 'upd-card-highlighted' : ''}`}
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
                <span className="upd-user-name-text">{highlightText(u.name, searchQuery)}</span>
              </Link>
              {u.usn && (
                <Link href={`/users/${u.usn}`} className="upd-usn-link">
                  • {highlightText(u.usn, searchQuery)}
                </Link>
              )}
            </div>
            <div className="upd-card-header-actions">
              <div
                className="upd-header-views-badge"
                title={`${u.views ?? 0} views`}
                onMouseEnter={() => viewsIconRef.current?.startAnimation?.()}
                onMouseLeave={() => viewsIconRef.current?.stopAnimation?.()}
              >
                <EyeIcon ref={viewsIconRef} className="upd-views-icon" size={14} />
                <span className="upd-views-count">{u.views ?? 0}</span>
              </div>
              <button
                type="button"
                className={`upd-ai-btn ${showAiSuggestions ? 'is-active' : ''}`}
                title="AI suggestions"
                aria-label="AI suggestions"
                onMouseEnter={() => aiBtnIconRef.current?.startAnimation?.()}
                onMouseLeave={() => aiBtnIconRef.current?.stopAnimation?.()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAiSuggestions();
                }}
              >
                <SparklesIcon ref={aiBtnIconRef} size={16} className="upd-ai-btn-icon" />
              </button>
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
                      className="upd-dropdown-item"
                      onClick={handleLearnLaterToggle}
                      onMouseEnter={() => bookmarkRef.current?.startAnimation?.()}
                      onMouseLeave={() => bookmarkRef.current?.stopAnimation?.()}
                    >
                      <BookmarkIcon ref={bookmarkRef} size={14} className={isSavedInLearnLater ? "upd-item-saved" : ""} />
                      <span>{isSavedInLearnLater ? "Saved in Learn Later" : "Add to Learn Later"}</span>
                    </button>
                    <button
                      type="button"
                      className="upd-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        handleShareUpdate(u._id, u.title || 'Update');
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
                  <span>{highlightText(u.title, searchQuery)}</span>
                </Link>
              </div>
            )}
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

      <ExpandableDescription content={u.content} className="upd-content" searchQuery={searchQuery} />

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
                const isPdf = typeof url === 'string' && url.toLowerCase().endsWith('.pdf');
                if (isPdf && url.includes('res.cloudinary.com')) {
                  downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
                }

                return (
                  <div
                    key={i}
                    className="upd-file-card"
                    onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <div className="upd-file-card-name" title={`View ${name}`}>
                      <FileIcon filename={name || url} />
                      <span className="upd-file-card-label">{highlightText(name, searchQuery)}</span>
                    </div>
                    <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                      <a href={viewUrl} target="_blank" rel="noreferrer noopener" className="upd-file-action-btn upd-file-action-view" title="View">
                        <EyeIcon size={14} />
                      </a>
                      <a href={downloadUrl} download={isPdf ? undefined : name} target={isPdf ? undefined : "_blank"} rel="noreferrer noopener" className="upd-file-action-btn upd-file-action-download" title="Download">
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
            <div className="upd-ai-inline-empty">
              No matching recommendations found for this update.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UpdatesPage({ initialUpdateId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const isLargeScreen = useIsLargeScreen();
  const keywordFromUrl = (searchParams.get('q') || '').trim();
  const sharedUpdateId = initialUpdateId || params?.id || searchParams.get('update') || null;

  const [updates, setUpdates] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(keywordFromUrl);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const highlightedCardRef = useRef(null);
  const titleBellRef = useRef(null);
  const addIconRef = useRef(null);
  const manageIconRef = useRef(null);
  const searchBtnRef = useRef(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchUpdates = async (index = 1, query = keywordFromUrl) => {
    setLoading(true);
    try {
      const urlParams = new globalThis.URLSearchParams({ index: String(index) });
      if (query) {
        urlParams.set('q', query);
      }
      if (sharedUpdateId) {
        urlParams.set('id', sharedUpdateId);
      }

      const res = await fetch(`/api/updates?${urlParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch updates');
      const data = await res.json();
      if (Array.isArray(data.updates)) {
        if (index === 1) setUpdates(data.updates);
        else setUpdates(prev => [...prev, ...data.updates]);
        setHasMore(data.updates.length === 10);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    setSearchQuery(keywordFromUrl);
    setPageIndex(1);
    fetchUpdates(1, keywordFromUrl);
  }, [keywordFromUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!(localStorage.getItem('token') || localStorage.getItem('usn')));
    }
  }, []);

  // Scroll highlighted update into view
  useEffect(() => {
    if (sharedUpdateId && highlightedCardRef.current) {
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [sharedUpdateId, updates]);

  const formatExactTimestamp = (iso) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;

      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;

      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return iso;
    }
  };

  const loadMore = () => {
    const next = pageIndex + 1;
    setPageIndex(next);
    fetchUpdates(next, keywordFromUrl);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      return;
    }

    const params = new globalThis.URLSearchParams(searchParams.toString());
    params.set('q', trimmed);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    router.push(pathname);
  };

  const buildQueryString = (updates) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...currentParams, ...updates };

    Object.keys(mergedParams).forEach((key) => {
      const value = mergedParams[key];
      if (value === null || value === undefined || value === '') {
        delete mergedParams[key];
      }
    });

    return Object.entries(mergedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  };

  const buildShareUrl = (updates) => {
    const queryString = buildQueryString(updates);
    const relativePath = queryString ? `${pathname}?${queryString}` : pathname;
    return `${typeof window !== 'undefined' ? window.location.origin : ''}${relativePath}`;
  };

  const handleShareUpdate = (updateId, updateTitle) => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/updates/${updateId}`;

    if (navigator.share) {
      navigator
        .share({
          title: updateTitle || 'Check this update',
          text: `Check out this update on Learnix`,
          url: shareUrl,
        })
        .catch(() => { });
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => showToast("Link copied to clipboard!", "success"))
        .catch(() => showToast("Failed to copy link", "error"));
    }
  };

  const UpdateSkeleton = () => (
    <div className="upd-card upd-skeleton">
      <div className="upd-card-header">
        <div className="upd-skeleton-avatar"></div>
        <div className="upd-skeleton-text-group">
          <div className="upd-skeleton-line upd-skeleton-name"></div>
          <div className="upd-skeleton-line upd-skeleton-title"></div>
        </div>
      </div>
      <div className="upd-skeleton-content">
        <div className="upd-skeleton-line upd-skeleton-text"></div>
        <div className="upd-skeleton-line upd-skeleton-text upd-skeleton-text-short"></div>
      </div>
    </div>
  );

  // Sort updates: highlighted one at top
  const sortedUpdates = sharedUpdateId
    ? [
      ...updates.filter((u) => u._id === sharedUpdateId),
      ...updates.filter((u) => u._id !== sharedUpdateId),
    ]
    : updates;

  return (
    <>
      <div className="upd-page-container">
        <main className="upd-main">
          <div className="upd-intro-card">
            <div className="upd-intro-header">
              <h1
                className="upd-title"
                onMouseEnter={() => titleBellRef.current?.startAnimation?.()}
                onMouseLeave={() => titleBellRef.current?.stopAnimation?.()}
              >
                <BellIcon ref={titleBellRef} className="upd-title-icon" size={24} />
                Updates
              </h1>
              {isLoggedIn && (
                <div className="upd-action-buttons">
                  <button
                    type="button"
                    className="upd-action-btn upd-action-btn-primary"
                    onClick={() => setShowAddModal(true)}
                    onMouseEnter={() => addIconRef.current?.startAnimation?.()}
                    onMouseLeave={() => addIconRef.current?.stopAnimation?.()}
                    title="Add Update"
                    aria-label="Add Update"
                  >
                    <PlusIcon ref={addIconRef} className="upd-action-icon" size={16} />
                    <span className="upd-action-text">Add Update</span>
                  </button>
                  <Link
                    href="/upload/updates"
                    className="upd-action-btn upd-action-btn-secondary"
                    onMouseEnter={() => manageIconRef.current?.startAnimation?.()}
                    onMouseLeave={() => manageIconRef.current?.stopAnimation?.()}
                    title="Manage Updates"
                    aria-label="Manage Updates"
                  >
                    <ListIcon ref={manageIconRef} className="upd-action-icon" size={16} />
                    <span className="upd-action-text">Manage</span>
                  </Link>
                </div>
              )}
            </div>

            <form className="upd-search-form" onSubmit={handleSearchSubmit}>
              <div className="upd-search-wrap">
                <SearchIcon className="upd-search-icon" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="upd-search-input"
                  placeholder="Search updates by title, content, or user..."
                  aria-label="Search updates"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="upd-search-clear-inline"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="upd-search-btn"
                disabled={!searchQuery.trim()}
                onMouseEnter={() => searchBtnRef.current?.startAnimation?.()}
                onMouseLeave={() => searchBtnRef.current?.stopAnimation?.()}
              >
                <SearchIcon ref={searchBtnRef} className="upd-search-btn-icon" size={16} />
                <span className="upd-search-btn-text">Search</span>
              </button>
            </form>
          </div>

          <div className="upd-list">
            {updates.length === 0 && !loading && (
              <div className="upd-empty-state">
                <ClockIcon className="upd-empty-icon" size={40} />
                <p className="upd-empty-text">{keywordFromUrl ? 'No updates found for this keyword.' : 'No updates yet.'}</p>
              </div>
            )}

            {loading && pageIndex === 1 && (
              <>
                <UpdateSkeleton />
                <UpdateSkeleton />
                <UpdateSkeleton />
              </>
            )}

            {sortedUpdates.map((u) => (
              <UpdateCard
                key={u._id}
                u={u}
                isHighlighted={sharedUpdateId === u._id}
                highlightedCardRef={highlightedCardRef}
                isLargeScreen={isLargeScreen}
                handleShareUpdate={handleShareUpdate}
                formatExactTimestamp={formatExactTimestamp}
                searchQuery={keywordFromUrl}
              />
            ))}

            {hasMore && updates.length > 0 && (
              <div className="upd-load-more-container">
                <button className="upd-load-more-btn" onClick={loadMore} disabled={loading}>
                  {loading ? (
                    <><span className="upd-spinner"></span><span>Loading...</span></>
                  ) : (
                    <><span>View More</span><FiChevronDown className="upd-btn-icon" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {showAddModal && (
        <div className="upd-modal-overlay" onClick={() => {
          setShowAddModal(false);
          fetchUpdates(1, keywordFromUrl); // Refresh when closed
        }}>
          <div className="upd-modal-content" onClick={e => e.stopPropagation()}>
            <button className="upd-modal-close" onClick={() => {
              setShowAddModal(false);
              fetchUpdates(1, keywordFromUrl);
            }}>✕</button>
            <div className="upd-modal-scroll-area">
              <AddUpdateForm
                onUpdateAdded={() => {
                  setShowAddModal(false);
                  fetchUpdates(1, keywordFromUrl);
                  showToast("Update added successfully", "success");
                }}
                onCancel={() => {
                  setShowAddModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Screen-Bottom Toast Notification */}
      {toast && (
        <div className={`upd-screen-toast upd-screen-toast-${toast.type || 'info'}`} role="status" aria-live="polite">
          <div className="upd-screen-toast-icon-box">
            {toast.type === "success" ? (
              <FiCheckCircle className="upd-screen-toast-icon" />
            ) : toast.type === "error" ? (
              <FiAlertCircle className="upd-screen-toast-icon" />
            ) : (
              <FiInfo className="upd-screen-toast-icon" />
            )}
          </div>
          <span className="upd-screen-toast-text">{toast.message}</span>
          <button
            type="button"
            className="upd-screen-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}
    </>
  );
}