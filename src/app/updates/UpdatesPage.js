"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import { FiClock, FiUser, FiExternalLink, FiChevronRight, FiChevronDown, FiChevronUp, FiEye, FiDownload, FiSearch, FiPlus, FiList, FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { Share2, Bell, Sparkles } from 'lucide-react';
import AddUpdateForm from '../upload/updates/AddUpdateForm';
import { getYouTubeVideoId, groupConsecutiveLinks } from '../utils/youtube';
import LinkPreview from '../components/LinkPreview';
import YouTubeEmbed from '../components/YouTubeEmbed';
import FileIcon from '../components/FileIcon';
import ExpandableDescription from '../components/ExpandableDescription';
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

function UpdateCard({
  u,
  isHighlighted,
  highlightedCardRef,
  isLargeScreen,
  handleShareUpdate,
  formatExactTimestamp,
}) {
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);

  const totalFiles = u.files?.length || 0;
  const FILES_LIMIT = 2;
  const hasMoreFiles = totalFiles > FILES_LIMIT;
  const visibleFiles = isFilesExpanded || !hasMoreFiles
    ? (u.files || [])
    : (u.files || []).slice(0, FILES_LIMIT);

  const totalLinks = u.links?.length || 0;
  const groups = groupConsecutiveLinks(u.links || []);

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
              <Link href={`/users/${u.usn || ''}`} className="upd-user-name-link">
                <FiUser className="upd-user-icon" />
                <span className="upd-user-name-text">{u.name}</span>
              </Link>
              {u.usn && (
                <Link href={`/users/${u.usn}`} className="upd-usn-link">
                  • {u.usn}
                </Link>
              )}
            </div>
            <div className="upd-card-header-actions">
              <Link
                href={`/updates/${u._id}`}
                className="upd-ai-btn"
                title="View with AI insights"
                aria-label="View with AI insights"
                onClick={(e) => e.stopPropagation()}
              >
                <Sparkles size={13} className="upd-ai-btn-icon" />
                <span className="upd-ai-btn-text">AI</span>
              </Link>
              <button
                type="button"
                className="upd-share-btn"
                title="Share update"
                aria-label="Share update"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareUpdate(u._id, u.title || 'Update');
                }}
              >
                <Share2 size={15} />
              </button>
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
            <div className="upd-timestamp">
              <FiClock className="upd-time-icon" />
              <span>{formatExactTimestamp(u.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <ExpandableDescription content={u.content} className="upd-content" />

      {/* Links section */}
      {u.links && u.links.length > 0 && (
        <div className="upd-links-section">
          <div className={`upd-links-wrapper ${hasMoreLinks && !isLinksExpanded ? 'is-collapsed' : ''}`}>
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
                      <span className="upd-file-card-label">{name}</span>
                    </div>
                    <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                      <a href={viewUrl} target="_blank" rel="noreferrer noopener" className="upd-file-action-btn upd-file-action-view" title="View">
                        <FiEye />
                      </a>
                      <a href={downloadUrl} download={isPdf ? undefined : name} target={isPdf ? undefined : "_blank"} rel="noreferrer noopener" className="upd-file-action-btn upd-file-action-download" title="Download">
                        <FiDownload />
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

  const handleSharePage = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://learnix.in/updates';
    const shareTitle = searchQuery ? `Learnix Updates - "${searchQuery}"` : 'Learnix Updates';

    if (navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: 'Check out the latest updates and announcements on Learnix',
          url: shareUrl,
        })
        .then(() => showToast("Shared successfully!", "success"))
        .catch(() => { });
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => showToast("Updates page link copied to clipboard!", "success"))
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
              <h1 className="upd-title">
                <Bell className="upd-title-icon" size={24} />
                Updates
              </h1>
              <div className="upd-header-right-actions">
                {isLoggedIn && (
                  <div className="upd-action-buttons">
                    <button
                      type="button"
                      className="upd-action-btn upd-action-btn-primary"
                      onClick={() => setShowAddModal(true)}
                      title="Add Update"
                      aria-label="Add Update"
                    >
                      <FiPlus className="upd-action-icon" />
                      <span className="upd-action-text">Add Update</span>
                    </button>
                    <Link
                      href="/upload/updates"
                      className="upd-action-btn upd-action-btn-secondary"
                      title="Manage Updates"
                      aria-label="Manage Updates"
                    >
                      <FiList className="upd-action-icon" />
                      <span className="upd-action-text">Manage</span>
                    </Link>
                  </div>
                )}
                <button
                  type="button"
                  className="upd-header-share-btn"
                  onClick={handleSharePage}
                  title="Share Updates Page"
                  aria-label="Share Updates Page"
                >
                  <Share2 size={16} />
                  <span className="upd-header-share-text">Share</span>
                </button>
              </div>
            </div>

            <form className="upd-search-form" onSubmit={handleSearchSubmit}>
              <div className="upd-search-wrap">
                <FiSearch className="upd-search-icon" />
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
              <button type="submit" className="upd-search-btn" disabled={!searchQuery.trim()}>
                <FiSearch className="upd-search-btn-icon" />
                <span className="upd-search-btn-text">Search</span>
              </button>
            </form>
          </div>

          <div className="upd-list">
            {updates.length === 0 && !loading && (
              <div className="upd-empty-state">
                <FiClock className="upd-empty-icon" />
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
              />
            ))}

            {hasMore && updates.length > 0 && (
              <div className="upd-load-more-container">
                <button className="upd-load-more-btn" onClick={loadMore} disabled={loading}>
                  {loading ? (
                    <><span className="upd-spinner"></span><span>Loading...</span></>
                  ) : (
                    <><span>View More</span><FiChevronRight className="upd-btn-icon" /></>
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